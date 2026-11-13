<?php
/**
 * NEUST BikeGo - Driver Accept or Reject Booking API
 * Endpoint: POST /neust-bike-api/driver_respond_booking.php
 */
require_once __DIR__ . '/db_connect.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit();
}

$bookingUid = trim($data['bookingId'] ?? '');
$driverId = trim($data['driverId'] ?? '');
$driverName = trim($data['driverName'] ?? 'Campus Driver');
$driverPhone = trim($data['driverPhone'] ?? '0917-555-0101');
$bikeNumber = trim($data['bikeNumber'] ?? 'BIKE-003');
$action = trim($data['action'] ?? 'accept'); // 'accept' or 'reject'

if (empty($bookingUid) || empty($driverId)) {
    echo json_encode(['success' => false, 'message' => 'Missing bookingId or driverId.']);
    exit();
}

if ($action === 'accept') {
    // Atomic update: only succeeds if booking is still in 'searching' status
    $stmt = $pdo->prepare("
        UPDATE bookings 
        SET status = 'driver_arriving',
            assigned_driver_id = ?,
            assigned_driver_name = ?,
            assigned_driver_phone = ?,
            assigned_bike_number = ?,
            target_driver_id = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE (booking_uid = ? OR booking_number = ?) AND status = 'searching'
    ");
    $stmt->execute([$driverId, $driverName, $driverPhone, $bikeNumber, $bookingUid, $bookingUid]);
    $affected = $stmt->rowCount();

    if ($affected > 0) {
        // Fetch booking passenger count to deduct seats on winning pedicab
        $bkStmt = $pdo->prepare("SELECT fare_amount FROM bookings WHERE (booking_uid = ? OR booking_number = ?) LIMIT 1");
        $bkStmt->execute([$bookingUid, $bookingUid]);
        $bkRow = $bkStmt->fetch();
        $paxBooked = max(1, min(4, intval(round(($bkRow['fare_amount'] ?? 10) / 10))));

        // Update driver's bike status and passenger_count
        $bikeStmt = $pdo->prepare("
            UPDATE bicycles 
            SET passenger_count = LEAST(max_capacity, passenger_count + ?),
                status = CASE WHEN (passenger_count + ?) >= max_capacity THEN 'full' ELSE 'on_trip' END
            WHERE bike_number = ?
        ");
        $bikeStmt->execute([$paxBooked, $paxBooked, $bikeNumber]);

        echo json_encode([
            'success' => true,
            'message' => 'Ride accepted successfully! Head to pickup location.',
            'status' => 'accepted'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Booking was already accepted by another driver or has expired/cancelled.',
            'status' => 'conflict'
        ]);
    }
} else {
    // Action = 'reject'
    // Fetch booking to update rejected list and dispatch to next driver
    $stmt = $pdo->prepare("SELECT * FROM bookings WHERE booking_uid = ? AND status = 'searching'");
    $stmt->execute([$bookingUid]);
    $b = $stmt->fetch();

    if (!$b) {
        echo json_encode(['success' => false, 'message' => 'Booking not found or no longer searching.']);
        exit();
    }

    $rejected = json_decode($b['rejected_driver_ids'] ?: '[]', true);
    if (!in_array($driverId, $rejected)) {
        $rejected[] = $driverId;
    }

    // Find next available driver not in rejected list
    $ph = empty($rejected) ? "''" : implode(',', array_fill(0, count($rejected), '?'));
    $nextDriverStmt = $pdo->prepare("
        SELECT user_uid FROM users 
        WHERE role = 'driver' AND account_status = 'active' AND user_uid NOT IN ($ph)
        LIMIT 1
    ");
    $nextDriverStmt->execute($rejected);
    $nextDriver = $nextDriverStmt->fetch();

    if ($nextDriver) {
        $newExpires = (time() + 25) * 1000;
        $upd = $pdo->prepare("UPDATE bookings SET target_driver_id = ?, request_expires_at = ?, rejected_driver_ids = ? WHERE booking_uid = ?");
        $upd->execute([$nextDriver['user_uid'], $newExpires, json_encode($rejected), $bookingUid]);
        echo json_encode(['success' => true, 'message' => 'Booking rejected. Re-dispatched to next driver.']);
    } else {
        // No more drivers
        $upd = $pdo->prepare("UPDATE bookings SET status = 'no_driver_found', target_driver_id = NULL, rejected_driver_ids = ? WHERE booking_uid = ?");
        $upd->execute([json_encode($rejected), $bookingUid]);
        echo json_encode(['success' => true, 'message' => 'Booking rejected. No more available drivers found.']);
    }
}

