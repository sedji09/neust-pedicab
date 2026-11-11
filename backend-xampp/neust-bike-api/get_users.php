<?php
/**
 * NEUST BikeGo - Get All Registered Users
 * Endpoint: GET /neust-bike-api/get_users.php
 */

require_once 'db_connect.php';

try {
    $stmt = $pdo->query("SELECT user_uid as id, full_name as fullName, email, id_number as idNumber, role, phone, department, avatar_url as avatarUrl, assigned_bicycle_number as assignedBicycleNumber, account_status as accountStatus, created_at as createdAt FROM users ORDER BY id DESC");
    $users = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'users' => $users
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

