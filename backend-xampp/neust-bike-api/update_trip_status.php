<?php
/**
 * NEUST BikeGo - Update Trip Status API
 * Endpoint: POST /neust-bike-api/update_trip_status.php
 */
require_once __DIR__ . '/db_connect.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit();
}

$bookingUid = trim($data['bookingId'] ?? '');
$newStatus = trim($data['status'] ?? ''); // 'driver_arriving', 'driver_arrived', 'in_progress', 'completed', 'cancelled'

$validStatuses = ['driver_arriving', 'driver_arrived', 'in_progress', 'completed', 'cancelled'];
if (!in_array($newStatus, $validStatuses)) {
    echo json_encode(['success' => false, 'message' => 'Invalid status value.']);
    exit();
}

$stmt = $pdo->prepare("SELECT * FROM bookings WHERE booking_uid = ? LIMIT 1");
$stmt->execute([$bookingUid]);
$booking = $stmt->fetch();

if (!$booking) {
    echo json_encode(['success' => false, 'message' => 'Booking not found.']);
    exit();
}

$upd = $pdo->prepare("UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE booking_uid = ?");
$upd->execute([$newStatus, $bookingUid]);

// If completed, record into trips table and free up bicycle
if ($newStatus === 'completed') {
    $tripNumber = 'TRIP-' . date('Ymd') . '-' . rand(100, 999);
    $tripStmt = $pdo->prepare("
        INSERT INTO trips (trip_number, bicycle_number, driver_name, pickup_location, destination, passenger_count, status, distance_meters)
        VALUES (?, ?, ?, ?, ?, 1, 'completed', ?)
    ");
    $tripStmt->execute([
        $tripNumber,
        $booking['assigned_bike_number'] ?: 'BIKE-003',
        $booking['assigned_driver_name'] ?: 'Campus Driver',
        $booking['pickup_name'],
        $booking['destination_name'],
        $booking['distance_meters']
    ]);

    // Reset bicycle
    if ($booking['assigned_bike_number']) {
        $bikeStmt = $pdo->prepare("UPDATE bicycles SET status = 'available', passenger_count = 0 WHERE bike_number = ?");
        $bikeStmt->execute([$booking['assigned_bike_number']]);
    }
}

echo json_encode([
    'success' => true,
    'message' => 'Booking status updated to: ' . $newStatus,
    'status' => $newStatus
]);

