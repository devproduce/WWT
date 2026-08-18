package com.orgaflow.member.controller;

import com.orgaflow.common.enums.UserStatus;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.member.dto.CreateMemberRequest;
import com.orgaflow.member.dto.MemberResponse;
import com.orgaflow.member.dto.UpdateMemberRequest;
import com.orgaflow.member.service.MemberService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @PostMapping
    public MemberResponse create(CurrentUser user, @Valid @RequestBody CreateMemberRequest request) {
        return memberService.create(user, request);
    }

    @GetMapping
    public List<MemberResponse> list(CurrentUser user) {
        return memberService.list(user);
    }

    @PatchMapping("/{id}/disable")
    public MemberResponse disable(CurrentUser user, @PathVariable String id) {
        return memberService.setStatus(user, id, UserStatus.DISABLED);
    }

    @PatchMapping("/{id}/enable")
    public MemberResponse enable(CurrentUser user, @PathVariable String id) {
        return memberService.setStatus(user, id, UserStatus.ACTIVE);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(CurrentUser user, @PathVariable String id) {
        memberService.remove(user, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}")
    public MemberResponse update(CurrentUser user, @PathVariable String id, @Valid @RequestBody UpdateMemberRequest request) {
        return memberService.update(user, id, request);
    }

    @PostMapping("/{id}/resend-invite")
    public MemberResponse resendInvite(CurrentUser user, @PathVariable String id) {
        return memberService.resendInvite(user, id);
    }

    @PostMapping("/{id}/cancel-invite")
    public ResponseEntity<Void> cancelInvite(CurrentUser user, @PathVariable String id) {
        memberService.cancelInvite(user, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reset-password")
    public MemberResponse resetPassword(CurrentUser user, @PathVariable String id) {
        return memberService.resetPassword(user, id);
    }
}
