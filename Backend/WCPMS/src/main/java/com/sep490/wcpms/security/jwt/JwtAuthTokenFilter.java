package com.sep490.wcpms.security.jwt;

import com.sep490.wcpms.security.services.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class JwtAuthTokenFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthTokenFilter.class);

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                String username = jwtUtils.getUserNameFromJwtToken(jwt);

                UserDetails userDetails = null;
                try {
                    userDetails = userDetailsService.loadUserByUsername(username);
                } catch (Exception ex) {
                    logger.debug("UserDetails not found for username {}: {}", username, ex.getMessage());
                }

                UsernamePasswordAuthenticationToken authentication;

                if (userDetails != null && userDetails.getAuthorities() != null && !userDetails.getAuthorities().isEmpty()) {
                    authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                } else {
                    // fallback: read roles from JWT claims and normalize into authorities
                    List<String> roles = jwtUtils.getRolesFromJwtToken(jwt);
                    Set<SimpleGrantedAuthority> authorities = new HashSet<>();
                    if (roles != null) {
                        for (String r : roles) {
                            if (r == null) continue;
                            String val = r.trim();
                            if (val.isEmpty()) continue;
                            // keep original form and alternate ROLE_ form
                            authorities.add(new SimpleGrantedAuthority(val));
                            if (val.startsWith("ROLE_")) {
                                String without = val.substring(5);
                                if (!without.isEmpty()) authorities.add(new SimpleGrantedAuthority(without));
                            } else {
                                authorities.add(new SimpleGrantedAuthority("ROLE_" + val));
                            }
                        }
                    }
                    User principal = new User(username, "", authorities);
                    authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
                    logger.debug("Applied authorities from JWT for user {}: {}", username,
                            authorities.stream().map(Object::toString).collect(Collectors.joining(",")));
                }

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

            } else {
                logger.debug("No valid JWT token found for request {}", request.getRequestURI());
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e.getMessage(), e);
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}
