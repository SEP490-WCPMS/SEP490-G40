package com.sep490.wcpms.mapper;

import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.dto.*;
import com.sep490.wcpms.entity.AnnulContractRequest;
import com.sep490.wcpms.entity.Contract;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface AnnulContractRequestMapper {

    // Từ Entity -> DTO (view)
    @Mapping(source = "contract.id", target = "contractId")
    @Mapping(source = "contract.contractNumber", target = "contractNumber")
    @Mapping(source = "requestedBy.id", target = "requestedById")
    @Mapping(source = "requestedBy.username", target = "requestedByUsername")
    @Mapping(source = "approvedBy.id", target = "approvedById")
    @Mapping(source = "approvedBy.username", target = "approvedByUsername")
    @Mapping(source = "notes", target = "notes")
    AnnulContractRequestDTO toDTO(AnnulContractRequest entity);

    // CreateDTO -> Entity (contract & requestedBy đã load)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "contract", expression = "java(contract)")
    @Mapping(target = "requestedBy", expression = "java(requestedBy)")
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "approvalDate", ignore = true)
    @Mapping(target = "approvalStatus", constant = "PENDING")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "notes", source = "dto.notes")
    AnnulContractRequest toEntity(AnnulContractRequestCreateDTO dto,
                                  Contract contract,
                                  Account requestedBy);

    // Update phê duyệt/từ chối
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mappings({
            @Mapping(target = "approvedBy", expression = "java(approvedBy)"),
            @Mapping(target = "approvalStatus", source = "dto.approvalStatus"),
            @Mapping(target = "approvalDate", source = "dto.approvalDate"),
            @Mapping(target = "notes", source = "dto.notes"),
            @Mapping(target = "attachedFiles", source = "dto.attachedFiles")
            // nếu KHÔNG muốn cho sửa requestNumber/reason/requestDate ở API này:
            // @Mapping(target = "requestNumber", ignore = true),
            // @Mapping(target = "reason", ignore = true),
            // @Mapping(target = "requestDate", ignore = true)
    })
    void updateApproval(@MappingTarget AnnulContractRequest entity,
                        AnnulContractRequestUpdateDTO dto,
                        Account approvedBy);
}
