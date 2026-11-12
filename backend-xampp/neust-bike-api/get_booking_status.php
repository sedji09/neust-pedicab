<?php
/**
 * NEUST BikeGo - Get Booking Status API
 * Endpoint: GET /neust-bike-api/get_booking_status.php?id=xxx or ?studentId=xxx
 */
require_once __DIR__ . '/db_connect.php';

$bookingUid = $_GET['id'] ?? null;
$studentUid = $_GET['studentId'] ?? null;

$b = null;
if ($bookingUid) {
    $stmt = $pdo->prepare("SELECT * FROM bookings WHERE booking_uid = ? LIMIT 1");
    $stmt->execute([$bookingUid]);
    $b = $stmt->fetch();
}
if (!$b && $studentUid) {
    $stmt = $pdo->prepare("SELECT * FROM bookings WHERE student_uid = ? AND status NOT IN ('completed', 'cancelled') ORDER BY id DESC LIMIT 1");
    $stmt->execute([$studentUid]);
    $b = $stmt->fetch();
}
if (!$bookingUid && !$studentUid) {
    echo json_encode(['success' => false, 'message' => 'Provide booking id or studentId.']);
    exit();
}
if (!$b) {
    echo json_encode(['success' => false, 'message' => 'No active booking found.']);
    exit();
}

echo json_encode([
    'success' => true,
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
        'assignedDriverId' => $b['assigned_driver_id'],
        'assignedDriverName' => $b['assigned_driver_name'],
        'assignedDriverPhone' => $b['assigned_driver_phone'],
        'assignedBikeNumber' => $b['assigned_bike_number'],
        'targetDriverId' => $b['target_driver_id'],
        'requestExpiresAt' => $b['request_expires_at'] ? intval($b['request_expires_at']) : null,
        'createdAt' => $b['created_at'],
        'updatedAt' => $b['updated_at']
    ]
]);

