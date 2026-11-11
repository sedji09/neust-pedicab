<?php
/**
 * NEUST BikeGo - Sign In API
 * Endpoint: POST /neust-bike-api/login.php
 */

require_once 'db_connect.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit();
}

$identifier = trim($input['identifier'] ?? '');
$password = trim($input['password'] ?? '');

if (empty($identifier) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Student ID / Email and Password are required.']);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT * FROM users 
        WHERE LOWER(email) = LOWER(?) OR LOWER(id_number) = LOWER(?)
        LIMIT 1
    ");
    $stmt->execute([$identifier, $identifier]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode([
            'success' => false,
            'message' => 'No account found with this Student ID Number or Email.'
        ]);
        exit();
    }

    if ($user['password'] !== $password) {
        echo json_encode([
            'success' => false,
            'message' => 'Incorrect password. (For demo accounts, use: password123)'
        ]);
        exit();
    }

    if ($user['account_status'] === 'suspended') {
        echo json_encode([
            'success' => false,
            'message' => 'This account has been suspended by campus administration.'
        ]);
        exit();
    }

    echo json_encode([
        'success' => true,
        'message' => 'Welcome back, ' . $user['full_name'] . '!',
        'user' => [
            'id' => $user['user_uid'],
            'fullName' => $user['full_name'],
            'email' => $user['email'],
            'idNumber' => $user['id_number'],
            'role' => $user['role'],
            'phone' => $user['phone'],
            'department' => $user['department'],
            'avatarUrl' => $user['avatar_url'],
            'assignedBicycleNumber' => $user['assigned_bicycle_number'],
            'accountStatus' => $user['account_status']
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database query error: ' . $e->getMessage()
    ]);
}

