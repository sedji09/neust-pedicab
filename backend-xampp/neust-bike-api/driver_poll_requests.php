<?php
/**
 * NEUST BikeGo - Driver Poll Incoming Requests API
 * Endpoint: GET /neust-bike-api/driver_poll_requests.php?driverId=xxx
 */
require_once __DIR__ . '/db_connect.php';

$driverId = $_GET['driverId'] ?? '';
if (empty($driverId)) {
    echo json_encode(['success' => false, 'message' => 'Driver ID is required.']);
    exit();
}

$nowMs = time() * 1000;

// Find incoming request targeted to this driver with status = 'searching' and not expired
$stmt = $pdo->prepare("
    SELECT * FROM bookings 
    WHERE (target_driver_id = ? OR target_driver_id IS NULL)
      AND status = 'searching' 
      AND (request_expires_at IS NULL OR request_expires_at > ?)
    ORDER BY id ASC LIMIT 1
");
$stmt->execute([$driverId, $nowMs]);
$b = $stmt->fetch();

if (!$b) {
    echo json_encode(['success' => true, 'hasRequest' => false]);
    exit();
}

echo json_encode([
    'success' => true,
    'hasRequest' => true,
    'booking' => [
        'id' => $b['booking_uid'],
        'bookingNumber' => $b['booking_number'],
        'studentId' => $b['student_uid'],
        'studentName' => $b['student_name'],
        'studentPhone' => $b['student_phone'],
        'studentIdNumber' => $b['student_id_number'],
        'passengerCount' => max(1, min(4, intval(round(($b['fare_amount'] ?? 10) / 10)))),
        'pickupName' => $b['pickup_name'],
        'pickupLat' => floatval($b['pickup_lat']),
        'pickupLng' => floatval($b['pickup_lng']),
        'pickupInstructions' => $b['pickup_instructions'],
        'destinationName' => $b['destination_name'],
        'destinationLat' => floatval($b['destination_lat']),
        'destinationLng' => floatval($b['destination_lng']),
        'distanceMeters' => intval($b['distance_meters']),
        'estimatedMinutes' => intval($b['estimated_minutes']),
        'fareAmount' => floatval($b['fare_amount']),
        'status' => $b['status'],
        'requestExpiresAt' => intval($b['request_expires_at']),
        'rejectedDriverIds' => json_decode($b['rejected_driver_ids'] ?: '[]', true)
    ]
]);

