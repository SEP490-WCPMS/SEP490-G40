package com.sep490.wcpms.mapper;

import com.sep490.wcpms.dto.ContractAnnulTransferRequestCreateDTO;
import com.sep490.wcpms.dto.ContractAnnulTransferRequestDTO;
import com.sep490.wcpms.dto.ContractAnnulTransferRequestUpdateDTO;
import com.sep490.wcpms.entity.*;
import org.mapstruct.*;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface ContractAnnulTransferRequestMapper {

    // ===== Entity -> DTO =====
    @Mapping(source = "contract.id",             target = "contractId")
    @Mapping(source = "contract.contractNumber", target = "contractNumber")

    @Mapping(source = "requestType",             target = "requestType")
    @Mapping(source = "requestNumber",           target = "requestNumber")
    @Mapping(source = "requestDate",             target = "requestDate")
    @Mapping(source = "reason",                  target = "reason")
    @Mapping(source = "attachedEvidence",        target = "attachedEvidence")

    @Mapping(source = "requestedBy.id",          target = "requestedById")
    // đổi 'username' thành field có thật (email/fullName/username) trong Account
    @Mapping(source = "requestedBy.username",    target = "requestedByUsername")
    @Mapping(source = "approvedBy.id",           target = "approvedById")
    @Mapping(source = "approvedBy.username",     target = "approvedByUsername")

    @Mapping(source = "approvalDate",            target = "approvalDate")
    @Mapping(source = "approvalStatus",          target = "approvalStatus")

    @Mapping(source = "fromCustomer.id",         target = "fromCustomerId")
    @Mapping(source = "toCustomer.id",           target = "toCustomerId")

    @Mapping(source = "notes",                   target = "notes")
    @Mapping(source = "createdAt",               target = "createdAt")
    @Mapping(source = "updatedAt",               target = "updatedAt")
    ContractAnnulTransferRequestDTO toDTO(ContractAnnulTransferRequest entity);

    // ===== CreateDTO -> Entity =====
    @Mapping(target = "id",             ignore = true)
    @Mapping(target = "contract",       expression = "java(contract)")
    @Mapping(target = "requestedBy",    expression = "java(requestedBy)")
    @Mapping(target = "fromCustomer",   expression = "java(fromCustomer)")
    @Mapping(target = "toCustomer",     expression = "java(toCustomer)")

    @Mapping(target = "requestType",    expression = "java(dto.getRequestType() == null ? null : dto.getRequestType().toLowerCase())")
    @Mapping(target = "requestNumber",  source = "dto.requestNumber")
    @Mapping(target = "requestDate",    source = "dto.requestDate")
    @Mapping(target = "reason",         source = "dto.reason")
    @Mapping(target = "attachedEvidence",  source = "dto.attachedEvidence")
    @Mapping(target = "notes",          source = "dto.notes")

    @Mapping(target = "approvedBy",     ignore = true)
    @Mapping(target = "approvalDate",   ignore = true)
    @Mapping(target = "approvalStatus", constant = "PENDING")
    @Mapping(target = "createdAt",      ignore = true)
    @Mapping(target = "updatedAt",      ignore = true)
    ContractAnnulTransferRequest toEntity(ContractAnnulTransferRequestCreateDTO dto,
                                          Contract contract,
                                          Account requestedBy,
                                          Customer fromCustomer,
                                          Customer toCustomer);

    // ===== Update APPROVAL =====
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mappings({
            @Mapping(target = "approvedBy",     expression = "java(approvedBy)"),
            @Mapping(target = "approvalStatus", source = "dto.approvalStatus"),
            @Mapping(target = "approvalDate",   source = "dto.approvalDate"),
            @Mapping(target = "notes",          source = "dto.notes"),
            @Mapping(target = "attachedEvidence",  source = "dto.attachedEvidence")
    })
    void updateApproval(@MappingTarget ContractAnnulTransferRequest entity,
                        ContractAnnulTransferRequestUpdateDTO dto,
                        Account approvedBy);
}
