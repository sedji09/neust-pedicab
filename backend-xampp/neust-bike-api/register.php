<?php
/**
 * NEUST BikeGo - Create Account (Registration API)
 * Endpoint: POST /neust-bike-api/register.php
 */

require_once 'db_connect.php';

// Retrieve JSON payload
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON input payload.'
    ]);
    exit();
}

// Extract fields
$fullName = trim($input['fullName'] ?? '');
$email = strtolower(trim($input['email'] ?? ''));
$idNumber = strtoupper(trim($input['idNumber'] ?? ''));
$password = trim($input['password'] ?? '');
$role = strtolower(trim($input['role'] ?? 'student'));
$phone = trim($input['phone'] ?? '0917-000-0000');
$department = trim($input['department'] ?? 'College of Information & Communications Technology (CICT)');
$assignedBike = trim($input['assignedBicycleNumber'] ?? null);

// Validations
if (empty($fullName)) {
    echo json_encode(['success' => false, 'message' => 'Full Name is required.']);
    exit();
}
if (empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Email address is required.']);
    exit();
}
if (empty($idNumber)) {
    echo json_encode(['success' => false, 'message' => 'Student ID / Employee ID is required.']);
    exit();
}
if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters long.']);
    exit();
}
if (!in_array($role, ['student', 'driver', 'admin'])) {
    $role = 'student';
}

try {
    // Check for duplicate email
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => "The email '$email' is already registered. Please sign in instead."
        ]);
        exit();
    }

    // Check for duplicate ID Number
    $stmt = $pdo->prepare("SELECT id FROM users WHERE id_number = ? LIMIT 1");
    $stmt->execute([$idNumber]);
    if ($stmt->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => "The Student/Employee ID '$idNumber' is already registered to another account."
        ]);
        exit();
    }

    // Default avatar
    $defaultAvatar = $role === 'driver'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        : ($role === 'admin'
            ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80');

    $userUid = $role . '-' . time() . '-' . rand(100, 999);

    // Insert user into MySQL database
    $insertStmt = $pdo->prepare("
        INSERT INTO users (user_uid, full_name, email, id_number, password, role, phone, department, avatar_url, assigned_bicycle_number, account_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    ");

    $insertStmt->execute([
        $userUid,
        $fullName,
        $email,
        $idNumber,
        $password, // Stored as provided (or use password_hash if desired)
        $role,
        $phone,
        $department,
        $defaultAvatar,
        $assignedBike
    ]);

    $newId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => "Account created successfully! Welcome to NEUST BikeGo, $fullName.",
        'user' => [
            'id' => $userUid,
            'fullName' => $fullName,
            'email' => $email,
            'idNumber' => $idNumber,
            'role' => $role,
            'phone' => $phone,
            'department' => $department,
            'avatarUrl' => $defaultAvatar,
            'assignedBicycleNumber' => $assignedBike,
            'accountStatus' => 'active'
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

