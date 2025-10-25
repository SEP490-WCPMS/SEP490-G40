package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.StaffProfileDTO;
import com.sep490.wcpms.service.StaffProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "http://localhost:3000")
public class StaffProfileController {

    @Autowired
    private StaffProfileService staffProfileService;

    @GetMapping("/profile/{accountId}")
    public ResponseEntity<StaffProfileDTO> getStaffProfile(@PathVariable Integer accountId) {
        StaffProfileDTO profile = staffProfileService.getStaffProfile(accountId);
        return ResponseEntity.ok(profile);
    }
}