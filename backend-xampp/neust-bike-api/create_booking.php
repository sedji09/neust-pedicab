<?php
/**
 * NEUST BikeGo - Create Transportation Booking API
 * Endpoint: POST /neust-bike-api/create_booking.php
 */
require_once __DIR__ . '/db_connect.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit();
}

$studentUid = trim($data['studentId'] ?? '');
$studentName = trim($data['studentName'] ?? '');
$studentPhone = trim($data['studentPhone'] ?? '0900-000-0000');
$studentIdNumber = trim($data['studentIdNumber'] ?? '2024-Student');
$pickupName = trim($data['pickupName'] ?? '');
$pickupLat = floatval($data['pickupLat'] ?? 0);
$pickupLng = floatval($data['pickupLng'] ?? 0);
$pickupInstructions = trim($data['pickupInstructions'] ?? '');
$destinationName = trim($data['destinationName'] ?? '');
$destinationLat = floatval($data['destinationLat'] ?? 0);
$destinationLng = floatval($data['destinationLng'] ?? 0);
$distanceMeters = intval($data['distanceMeters'] ?? 400);
$estimatedMinutes = intval($data['estimatedMinutes'] ?? 3);
$fareAmount = floatval($data['fareAmount'] ?? 0);
$passengerCount = max(1, min(4, intval($data['passengerCount'] ?? 1)));

if (empty($studentUid) || empty($pickupName) || empty($destinationName)) {
    echo json_encode(['success' => false, 'message' => 'Missing required booking fields.']);
    exit();
}

// If student had a previous booking still in 'searching' status, cancel it so new booking broadcasts cleanly
$pdo->prepare("UPDATE bookings SET status = 'cancelled' WHERE student_uid = ? AND status = 'searching'")->execute([$studentUid]);

// Check for conflicting active in-progress trip for this student (within the last 30 minutes)
$stmt = $pdo->prepare("SELECT booking_uid, status FROM bookings WHERE student_uid = ? AND status IN ('accepted', 'driver_arriving', 'driver_arrived', 'in_progress') AND created_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE) LIMIT 1");
$stmt->execute([$studentUid]);
$existing = $stmt->fetch();

if ($existing) {
    echo json_encode([
        'success' => false,
        'message' => 'You already have an active ride (' . $existing['booking_uid'] . ') in status: ' . $existing['status'],
        'existingBookingUid' => $existing['booking_uid']
    ]);
    exit();
}

// Use client's booking id and number if provided to maintain 100% ID sync across devices, or generate new ones
$bookingUid = !empty($data['id']) ? trim($data['id']) : ('bk-' . bin2hex(random_bytes(6)));
$bookingNumber = !empty($data['bookingNumber']) ? trim($data['bookingNumber']) : ('BK-' . date('Ymd') . '-' . rand(100, 999));

// Broadcast to ALL online drivers whose pedicab has >= $passengerCount available seats (Paunahan / First-Come-First-Served)
$targetDriverId = null;
$requestExpiresAt = (time() + 90) * 1000; // 90 seconds in milliseconds

$insertStmt = $pdo->prepare("
    INSERT INTO bookings (
        booking_uid, booking_number, student_uid, student_name, student_phone, student_id_number,
        pickup_name, pickup_lat, pickup_lng, pickup_instructions,
        destination_name, destination_lat, destination_lng,
        distance_meters, estimated_minutes, fare_amount, status,
        target_driver_id, request_expires_at, rejected_driver_ids
    ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, 'searching',
        ?, ?, '[]'
    )
");

$insertStmt->execute([
    $bookingUid, $bookingNumber, $studentUid, $studentName, $studentPhone, $studentIdNumber,
    $pickupName, $pickupLat, $pickupLng, $pickupInstructions,
    $destinationName, $destinationLat, $destinationLng,
    $distanceMeters, $estimatedMinutes, $fareAmount,
    $targetDriverId, $requestExpiresAt
]);

echo json_encode([
    'success' => true,
    'message' => 'Booking created successfully. Searching for nearby campus driver.',
    'booking' => [
        'id' => $bookingUid,
        'bookingNumber' => $bookingNumber,
        'studentId' => $studentUid,
        'studentName' => $studentName,
        'pickupName' => $pickupName,
        'pickupLat' => $pickupLat,
        'pickupLng' => $pickupLng,
        'destinationName' => $destinationName,
        'destinationLat' => $destinationLat,
        'destinationLng' => $destinationLng,
        'distanceMeters' => $distanceMeters,
        'estimatedMinutes' => $estimatedMinutes,
        'passengerCount' => $passengerCount,
        'fareAmount' => $fareAmount,
        'status' => 'searching',
        'targetDriverId' => $targetDriverId,
        'requestExpiresAt' => $requestExpiresAt,
        'createdAt' => date('c'),
        'updatedAt' => date('c')
    ]
]);

