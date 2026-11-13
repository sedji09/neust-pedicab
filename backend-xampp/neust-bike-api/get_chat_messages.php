<?php
/**
 * NEUST BikeGo - Get Real-time Chat Messages API
 * Endpoint: GET /neust-bike-api/get_chat_messages.php?bookingId=xxx&bookingNumber=xxx
 */
require_once __DIR__ . '/db_connect.php';

// Auto-create chat_messages table if not exists
$pdo->exec("
    CREATE TABLE IF NOT EXISTS `chat_messages` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `message_uid` VARCHAR(60) NOT NULL UNIQUE,
      `booking_uid` VARCHAR(60) NOT NULL,
      `booking_number` VARCHAR(30) DEFAULT NULL,
      `sender_id` VARCHAR(60) NOT NULL,
      `sender_name` VARCHAR(150) NOT NULL,
      `sender_role` ENUM('student', 'driver') NOT NULL,
      `message` TEXT NOT NULL,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (`booking_uid`),
      INDEX (`booking_number`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

$bookingUid = trim($_GET['bookingId'] ?? '');
$bookingNumber = trim($_GET['bookingNumber'] ?? '');

if (empty($bookingUid) && empty($bookingNumber)) {
    echo json_encode(['success' => false, 'messages' => []]);
    exit();
}

// Also look up canonical booking_uid and booking_number from bookings table
$resolvedUid = $bookingUid;
$resolvedNumber = $bookingNumber;
try {
    $bkStmt = $pdo->prepare("
        SELECT booking_uid, booking_number 
        FROM bookings 
        WHERE (booking_uid = ? AND booking_uid != '')
           OR (booking_number = ? AND booking_number != '')
           OR (booking_uid = ? AND booking_uid != '')
           OR (booking_number = ? AND booking_number != '')
        ORDER BY id DESC LIMIT 1
    ");
    $bkStmt->execute([$bookingUid, $bookingNumber, $bookingNumber, $bookingUid]);
    $bkRow = $bkStmt->fetch();
    if ($bkRow) {
        if (!empty($bkRow['booking_uid'])) $resolvedUid = $bkRow['booking_uid'];
        if (!empty($bkRow['booking_number'])) $resolvedNumber = $bkRow['booking_number'];
    }
} catch (Exception $e) {}

$stmt = $pdo->prepare("
    SELECT * FROM chat_messages 
    WHERE (booking_uid = ? AND booking_uid != '') 
       OR (booking_number = ? AND booking_number != '')
       OR (booking_uid = ? AND booking_uid != '')
       OR (booking_uid = ? AND booking_uid != '')
       OR (booking_number = ? AND booking_number != '')
    ORDER BY id ASC
");
$stmt->execute([$bookingUid, $bookingNumber, $bookingNumber, $resolvedUid, $resolvedNumber]);
$rows = $stmt->fetchAll();

$messages = [];
foreach ($rows as $r) {
    $timeStr = date('h:i A', strtotime($r['created_at']));
    $messages[] = [
        'id' => $r['message_uid'],
        'bookingId' => $r['booking_uid'] ?: $resolvedUid,
        'bookingNumber' => $r['booking_number'] ?: $resolvedNumber,
        'senderId' => $r['sender_id'],
        'senderName' => $r['sender_name'],
        'senderRole' => $r['sender_role'],
        'message' => $r['message'],
        'timestamp' => $timeStr,
        'createdAt' => $r['created_at']
    ];
}

echo json_encode([
    'success' => true,
    'messages' => $messages
]);
