package com.hatoms.tms.auth;

import com.hatoms.tms.security.JwtUtil;
import com.hatoms.tms.user.User;
import com.hatoms.tms.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwt;

  public AuthController(UserRepository userRepository,
                        PasswordEncoder passwordEncoder,
                        JwtUtil jwt) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwt = jwt;
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody LoginRequest req) {
    var opt = userRepository.findByUsername(req.getUsername());
    if (opt.isEmpty()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(Map.of("message", "Ungültige Anmeldedaten"));
    }

    User user = opt.get();
    if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(Map.of("message", "Ungültige Anmeldedaten"));
    }

    // TTL kommt jetzt aus application.yml (in JwtUtil konfiguriert)
    String token = jwt.generate(user.getUsername(), user.getRole().name());

    return ResponseEntity.ok(Map.of(
        "token", token,
        "role", user.getRole().name(),
        "username", user.getUsername()
    ));
  }

  public static class LoginRequest {
    private String username;
    private String password;
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
  }
}
