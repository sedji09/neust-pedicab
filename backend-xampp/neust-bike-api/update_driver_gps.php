<?php
/**
 * ==============================================================
 * NEUST BIKEGO - UPDATE DRIVER REAL-TIME GPS (XAMPP PHP API)
 * Securely updates driver GPS coordinates, heading, and speed in MySQL
 * ==============================================================
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connect.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid JSON payload received'
    ]);
    exit();
}

$bike_number = trim($data['bike_number'] ?? '');
$driver_id   = trim($data['driver_id'] ?? '');
$lat         = isset($data['lat']) ? floatval($data['lat']) : null;
$lng         = isset($data['lng']) ? floatval($data['lng']) : null;
$heading     = isset($data['heading']) ? floatval($data['heading']) : 0.0;
$speed_kmh   = isset($data['speed_kmh']) ? floatval($data['speed_kmh']) : 0.0;

if (empty($bike_number) || $lat === null || $lng === null) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Missing required fields: bike_number, lat, and lng are required'
    ]);
    exit();
}

// 1. Validate latitude and longitude range (NEUST Sumacab & Philippines envelope)
if ($lat < 14.0 || $lat > 17.0 || $lng < 120.0 || $lng > 122.0) {
    echo json_encode([
        'status' => 'error',
        'message' => 'GPS coordinates out of valid campus range'
    ]);
    exit();
}

try {
    // 2. Ensure heading column exists in bicycles table
    try {
        $checkCol = $pdo->query("SHOW COLUMNS FROM `bicycles` LIKE 'heading'");
        if ($checkCol->rowCount() === 0) {
            $pdo->exec("ALTER TABLE `bicycles` ADD COLUMN `heading` DECIMAL(5, 1) NOT NULL DEFAULT 0.0 AFTER `lng`");
        }
    } catch (Exception $e) {
        // column may already exist
    }

    // 3. Update bicycle coordinates in database
    $stmt = $pdo->prepare("
        UPDATE `bicycles` 
        SET 
            `lat` = :lat,
            `lng` = :lng,
            `heading` = :heading,
            `speed_kmh` = :speed_kmh,
            `status` = CASE WHEN `status` = 'offline' THEN 'available' ELSE `status` END,
            `updated_at` = CURRENT_TIMESTAMP
        WHERE `bike_number` = :bike_number
    ");

    $stmt->execute([
        ':lat' => $lat,
        ':lng' => $lng,
        ':heading' => $heading,
        ':speed_kmh' => $speed_kmh,
        ':bike_number' => $bike_number
    ]);

    // 4. Check if driver has an active booking
    $bStmt = $pdo->prepare("
        SELECT id, booking_uid, booking_number, status, pickup_lat, pickup_lng, destination_lat, destination_lng
        FROM `bookings`
        WHERE `assigned_bike_number` = :bike_number
          AND `status` IN ('accepted', 'driver_arriving', 'driver_arrived', 'in_progress')
        LIMIT 1
    ");
    $bStmt->execute([':bike_number' => $bike_number]);
    $activeBooking = $bStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'message' => 'Driver GPS updated successfully',
        'data' => [
            'bike_number' => $bike_number,
            'lat' => $lat,
            'lng' => $lng,
            'heading' => $heading,
            'speed_kmh' => $speed_kmh,
            'timestamp' => date('Y-m-d H:i:s'),
            'has_active_booking' => !empty($activeBooking),
            'active_booking' => $activeBooking ? [
                'booking_number' => $activeBooking['booking_number'],
                'status' => $activeBooking['status']
            ] : null
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

