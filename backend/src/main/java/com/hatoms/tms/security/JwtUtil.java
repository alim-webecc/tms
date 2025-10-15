package com.hatoms.tms.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtil {

  private final Key key;
  private final long defaultTtlMillis;

  public JwtUtil(
      @Value("${security.jwt.secret}") String secret,
      @Value("${security.jwt.ttlSeconds:7200}") long ttlSeconds
  ) {
    byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
    if (bytes.length < 32) {
      byte[] padded = new byte[32];
      System.arraycopy(bytes, 0, padded, 0, Math.min(bytes.length, 32));
      bytes = padded;
    }
    this.key = Keys.hmacShaKeyFor(bytes);
    this.defaultTtlMillis = ttlSeconds * 1000L;
  }

  /** Erzeugt ein Token mit Standard-TTL aus application.yml */
  public String generate(String username, String role) {
    return generateToken(username, Map.of("role", role), defaultTtlMillis);
  }

  /** Generische Variante mit custom TTL */
  public String generateToken(String subject, Map<String, Object> claims, long ttlMillis) {
    long now = System.currentTimeMillis();
    return Jwts.builder()
        .setSubject(subject)
        .addClaims(claims)
        .setIssuedAt(new Date(now))
        .setExpiration(new Date(now + ttlMillis))
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  public Claims parse(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token)
        .getBody();
  }
}
