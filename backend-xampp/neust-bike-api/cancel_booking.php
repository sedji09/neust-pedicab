<?php
/**
 * NEUST BikeGo - Cancel Booking API
 * Endpoint: POST /neust-bike-api/cancel_booking.php
 */
require_once __DIR__ . '/db_connect.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit();
}

$bookingUid = trim($data['bookingId'] ?? '');
$reason = trim($data['reason'] ?? 'Cancelled by user');

if (empty($bookingUid)) {
    echo json_encode(['success' => false, 'message' => 'Booking ID is required.']);
    exit();
}

$stmt = $pdo->prepare("SELECT * FROM bookings WHERE booking_uid = ? LIMIT 1");
$stmt->execute([$bookingUid]);
$booking = $stmt->fetch();

if (!$booking) {
    echo json_encode(['success' => false, 'message' => 'Booking not found.']);
    exit();
}

$upd = $pdo->prepare("UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE booking_uid = ?");
$upd->execute([$bookingUid]);

// Release bicycle if assigned
if (!empty($booking['assigned_bike_number'])) {
    $bikeStmt = $pdo->prepare("UPDATE bicycles SET status = 'available', passenger_count = 0 WHERE bike_number = ?");
    $bikeStmt->execute([$booking['assigned_bike_number']]);
}

echo json_encode([
    'success' => true,
    'message' => 'Booking cancelled successfully.',
    'status' => 'cancelled'
]);

