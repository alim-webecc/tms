package com.thspedition.config;

import com.thspedition.security.JwtAuthFilter;
import com.thspedition.security.JwtUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http, JwtUtil jwt) throws Exception {
    http
      .csrf(csrf -> csrf.disable())
      .cors(Customizer.withDefaults())
      .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .requestMatchers("/api/auth/login").permitAll()
        .requestMatchers("/api/**").authenticated()
        .anyRequest().permitAll()
      )
      .addFilterBefore(new JwtAuthFilter(jwt), UsernamePasswordAuthenticationFilter.class)
      .headers(headers -> {
        // Clickjacking-Schutz
        headers.frameOptions(frame -> frame.deny());
        // MIME sniffing aus
        headers.contentTypeOptions(Customizer.withDefaults());
        // Referrer-Policy
        headers.referrerPolicy(r ->
          r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER)
        );
        // Permissions-Policy (alles aus)
        headers.permissionsPolicy(p ->
          p.policy("geolocation=(), microphone=(), camera=()")
        );
        // Content-Security-Policy
        headers.contentSecurityPolicy(csp -> csp.policyDirectives(
          "default-src 'self'; " +
          "base-uri 'self'; " +
          "object-src 'none'; " +
          "frame-ancestors 'none'; " +
          "img-src 'self' data:; " +
          "style-src 'self'; " +
          "script-src 'self'; " +
          // Frontend-Entwicklung (Live Server / http-server) + Backend
          "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 http://localhost:5500 http://127.0.0.1:5500 http://localhost:8081"
        ));
        // HSTS nur in PROD mit HTTPS aktivieren:
        // headers.httpStrictTransportSecurity(hsts ->
        //   hsts.includeSubDomains(true).preload(true).maxAgeInSeconds(31536000)
        // );
      });

    return http.build();
  }

  // CORS zentral hier konfigurieren (YAML-CORS abgebaut)
  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    var cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of(
      "http://localhost:8000", "http://127.0.0.1:8000",
      "http://localhost:5500", "http://127.0.0.1:5500"
      // Prod: "https://deinedomain.de"
    ));
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    cfg.setAllowCredentials(true);

    var src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/**", cfg);
    return src;
  }
}
