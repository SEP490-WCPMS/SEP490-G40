package com.sep490.wcpms.dto;

import com.sep490.wcpms.entity.WaterPriceType;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class WaterPriceTypeDTO {
    private Integer id;
    private String typeName;
    private String description;

    public WaterPriceTypeDTO(WaterPriceType entity) {
        this.id = entity.getId();
        this.typeName = entity.getTypeName();
        this.description = entity.getDescription();
    }
}