package com.sep490.wcpms.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Async // Gửi mail bất đồng bộ để không làm treo ứng dụng
    public void sendEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            System.out.println("Email sent successfully to " + to);
        } catch (Exception e) {
            System.err.println("Error sending email: " + e.getMessage());
            // Không ném lỗi để tránh làm gián đoạn luồng chính, chỉ log lại
        }
    }

    @Async // Gửi mail chạy ngầm để không làm đơ server
    public void sendVerificationEmail(String toEmail, String fullName, String token) {
        String subject = "Kích hoạt tài khoản WCPMS";
        String verificationUrl = "http://localhost:5173/verify?token=" + token;

        String content = "<p>Xin chào " + fullName + ",</p>"
                + "<p>Cảm ơn bạn đã đăng ký. Vui lòng nhấp vào liên kết bên dưới để kích hoạt tài khoản:</p>"
                + "<h3><a href=\"" + verificationUrl + "\">KÍCH HOẠT TÀI KHOẢN</a></h3>"
                + "<p>Liên kết này sẽ hết hạn sau 24 giờ.</p>";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom("noreply@wcpms.com");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(content, true); // true = gửi HTML

            mailSender.send(message);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }
}