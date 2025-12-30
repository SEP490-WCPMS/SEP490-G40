package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reading_periods", uniqueConstraints = {
        @UniqueConstraint(name = "uk_reading_periods_period", columnNames = "period")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReadingPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "period", length = 7, nullable = false)
    private String period; // Định dạng MM/YYYY
}