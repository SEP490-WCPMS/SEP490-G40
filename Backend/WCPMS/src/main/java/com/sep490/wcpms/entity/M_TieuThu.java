package com.sep490.wcpms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "M_TIEUTHU")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class M_TieuThu {

    @Id
    @Column(name = "IDTT", nullable = false)
    private Long idTt;

    @Column(name = "COKYHDTRUOC", nullable = false)
    private Boolean coKyhdTruoc;

    @ManyToOne
    @JoinColumn(name = "MAKYHD", nullable = false)
    private Kyhd kyhd;

    @ManyToOne
    @JoinColumn(name = "MATUYEN", nullable = false)
    private Tuyen tuyen;

    @Column(name = "STT", nullable = false)
    private Integer stt;

    @ManyToOne
    @JoinColumn(name = "MAKH", nullable = false)
    private KhachHang khachHang;

    @Column(name = "SONK")
    private Integer soNk;

    @Column(name = "CSCU1")
    private Double cscu1;

    @Column(name = "CSMOI1")
    private Double csMoi1;

    @Column(name = "M3TT1")
    private Double m3tt1;

    @Column(name = "NGAYGHI1")
    private LocalDateTime ngayGhi1;

    @Column(name = "COCS", nullable = false)
    private Boolean coCs;

    @Column(name = "SOTTCU")
    private Double soTtCu;

    @Column(name = "CSCU")
    private Double csCu;

    @Column(name = "CSMOI")
    private Double csMoi;

    @Column(name = "M3TT")
    private Double m3Tt;

    @Column(name = "NGAYGHI")
    private LocalDateTime ngayGhi;

    @Column(name = "LASTSYNC", nullable = false)
    private LocalDateTime lastSync;

    @Column(name = "NVG_USER", length = 32)
    private String nvgUser;

    @Column(name = "TTGHI", nullable = false)
    private Integer ttGhi;

    @Column(name = "DANHAP", nullable = false)
    private Boolean daNhap;

    @Column(name = "X")
    private Double x;

    @Column(name = "Y")
    private Double y;

    @Lob
    @Column(name = "HINH")
    private String hinh;

    @Column(name = "GHICHU", length = 255)
    private String ghiChu;

    @Column(name = "DACAPNHAT", nullable = false)
    private Boolean daCapNhat;

    @Column(name = "NGAYCAPNHAT")
    private LocalDateTime ngayCapNhat;

    @Column(name = "HETNO", nullable = false)
    private Boolean hetNo;

    @Column(name = "NGAYCN")
    private LocalDate ngayCn;

    @Column(name = "NGAYNHAPCN")
    private LocalDateTime ngayNhapCn;

    @Column(name = "MANVNHAPCN")
    private Long maNvNhapCn;

    @Column(name = "SOPHIEUCN", length = 16)
    private String soPhieuCn;

    @Column(name = "maMOINOI", nullable = false)
    private Long maMoiNoi;
}
