<?php
/**
 * NEUST BikeGo - Send Real-time Chat Message API
 * Endpoint: POST /neust-bike-api/send_chat_message.php
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

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit();
}

$bookingUid = trim($data['bookingId'] ?? '');
$bookingNumber = trim($data['bookingNumber'] ?? '');
$senderId = trim($data['senderId'] ?? '');
$senderName = trim($data['senderName'] ?? '');
$senderRole = trim($data['senderRole'] ?? 'student'); // 'student' or 'driver'
$messageText = trim($data['message'] ?? '');

if (empty($bookingUid) && empty($bookingNumber)) {
    echo json_encode(['success' => false, 'message' => 'Missing booking identifier.']);
    exit();
}

if (empty($messageText)) {
    echo json_encode(['success' => false, 'message' => 'Message text cannot be empty.']);
    exit();
}

// Resolve canonical booking_uid and booking_number from bookings table so both phones always match
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
        if (!empty($bkRow['booking_uid'])) {
            $bookingUid = $bkRow['booking_uid'];
        }
        if (!empty($bkRow['booking_number'])) {
            $bookingNumber = $bkRow['booking_number'];
        }
    }
} catch (Exception $e) {
    // Keep provided identifiers on lookup error
}

$msgUid = 'msg-' . bin2hex(random_bytes(6)) . '-' . time();

$stmt = $pdo->prepare("
    INSERT INTO chat_messages (message_uid, booking_uid, booking_number, sender_id, sender_name, sender_role, message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([
    $msgUid,
    $bookingUid,
    $bookingNumber,
    $senderId,
    $senderName,
    $senderRole,
    $messageText
]);

echo json_encode([
    'success' => true,
    'message' => 'Message sent successfully.',
    'chat' => [
        'id' => $msgUid,
        'bookingId' => $bookingUid,
        'bookingNumber' => $bookingNumber,
        'senderId' => $senderId,
        'senderName' => $senderName,
        'senderRole' => $senderRole,
        'message' => $messageText,
        'timestamp' => date('h:i A')
    ]
]);
