<?php
/**
 * NEUST BikeGo - Upsert / Update Bicycle Status & Location API
 * Endpoint: POST /neust-bike-api/update_bicycle_status.php
 */
require_once __DIR__ . '/db_connect.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['bikeNumber'])) {
    echo json_encode(['success' => false, 'message' => 'bikeNumber is required.']);
    exit();
}

$bikeNumber = trim($input['bikeNumber']);
$driverName = trim($input['driverName'] ?? 'Campus Driver');
$driverPhone = trim($input['driverPhone'] ?? '0917-000-0000');
$driverPhoto = $input['driverPhoto'] ?? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80';
$status = $input['status'] ?? 'available';
$passengerCount = intval($input['passengerCount'] ?? 0);
$maxCapacity = intval($input['maxCapacity'] ?? 4);
$lat = floatval($input['lat'] ?? 15.444889);
$lng = floatval($input['lng'] ?? 120.940417);
$currentStation = trim($input['currentStation'] ?? 'NEUST Gate & Trike Bike Terminal (Terminal)');
$currentDestination = trim($input['currentDestination'] ?? 'Available for Campus Trips');
$speedKmh = floatval($input['speedKmH'] ?? 0);
$batteryPercent = intval($input['batteryPercent'] ?? 95);

$allowedStatuses = ['available', 'almost_full', 'full', 'on_trip', 'maintenance', 'offline'];
if (!in_array($status, $allowedStatuses, true)) {
    $status = 'available';
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO bicycles (
            bike_number, driver_name, driver_phone, driver_photo,
            passenger_count, max_capacity, status, lat, lng,
            current_station, current_destination, battery_percent, speed_kmh
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            driver_name = VALUES(driver_name),
            driver_phone = VALUES(driver_phone),
            driver_photo = VALUES(driver_photo),
            passenger_count = VALUES(passenger_count),
            max_capacity = VALUES(max_capacity),
            status = VALUES(status),
            lat = VALUES(lat),
            lng = VALUES(lng),
            current_station = VALUES(current_station),
            current_destination = VALUES(current_destination),
            battery_percent = VALUES(battery_percent),
            speed_kmh = VALUES(speed_kmh)
    ");

    $stmt->execute([
        $bikeNumber, $driverName, $driverPhone, $driverPhoto,
        $passengerCount, $maxCapacity, $status, $lat, $lng,
        $currentStation, $currentDestination, $batteryPercent, $speedKmh
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Bicycle status synced to XAMPP MySQL.'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update bicycle status: ' . $e->getMessage()
    ]);
}

