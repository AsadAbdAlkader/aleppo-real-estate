import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AgentService } from '../../core/services/agent.service';
import { UserProfile } from '../../core/models/auth.model';
import { Agency } from '../../core/models/agent.model';

export function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: []
})
export class ProfileComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly agentService = inject(AgentService);
  private readonly fb = inject(FormBuilder);

  readonly profile = signal<UserProfile | null>(null);
  readonly agencies = signal<Agency[]>([]);
  readonly isLoadingProfile = signal<boolean>(true);
  readonly activeTab = signal<'personal' | 'security' | 'agent'>('personal');

  readonly isSavingPersonal = signal<boolean>(false);
  readonly isSavingPassword = signal<boolean>(false);
  readonly isSavingAgent = signal<boolean>(false);

  readonly personalSuccessMsg = signal<string | null>(null);
  readonly personalErrorMsg = signal<string | null>(null);

  readonly passwordSuccessMsg = signal<string | null>(null);
  readonly passwordErrorMsg = signal<string | null>(null);

  readonly agentSuccessMsg = signal<string | null>(null);
  readonly agentErrorMsg = signal<string | null>(null);

  readonly personalForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    phoneNumber: [''],
    email: [{ value: '', disabled: true }],
    role: [{ value: '', disabled: true }]
  });

  readonly passwordForm = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordsMatchValidator }
  );

  readonly agentForm = this.fb.group({
    bio: [''],
    publicPhone: [''],
    agencyId: ['']
  });

  ngOnInit(): void {
    this.loadProfile();
    if (this.authService.userRole() === 'Agent' || this.authService.userRole() === 'Admin') {
      this.loadAgenciesAndAgentProfile();
    }
  }

  loadProfile(): void {
    this.isLoadingProfile.set(true);
    this.authService.getProfile().subscribe({
      next: (prof) => {
        this.profile.set(prof);
        this.personalForm.patchValue({
          firstName: prof.firstName,
          lastName: prof.lastName,
          phoneNumber: prof.phoneNumber || '',
          email: prof.email,
          role: this.getRoleLabel(prof.role)
        });
        this.isLoadingProfile.set(false);
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        this.isLoadingProfile.set(false);
      }
    });
  }

  loadAgenciesAndAgentProfile(): void {
    this.agentService.getAgencies(1, 50).subscribe({
      next: (res) => {
        this.agencies.set(res.items || []);
      }
    });

    const userId = this.authService.currentUser()?.id;
    if (userId) {
      this.agentService.getAgentById(userId).subscribe({
        next: (agent) => {
          this.agentForm.patchValue({
            bio: agent.bio || '',
            publicPhone: agent.publicPhone || '',
            agencyId: agent.agencyId || ''
          });
        }
      });
    }
  }

  setTab(tab: 'personal' | 'security' | 'agent'): void {
    this.activeTab.set(tab);
    this.personalSuccessMsg.set(null);
    this.personalErrorMsg.set(null);
    this.passwordSuccessMsg.set(null);
    this.passwordErrorMsg.set(null);
    this.agentSuccessMsg.set(null);
    this.agentErrorMsg.set(null);
  }

  getRoleLabel(role?: string): string {
    const r = role || this.authService.userRole();
    if (r === 'Agent') return 'وكيل عقاري';
    if (r === 'Admin') return 'مدير النظام';
    return 'مشتري';
  }

  onSubmitPersonal(): void {
    this.personalSuccessMsg.set(null);
    this.personalErrorMsg.set(null);

    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      return;
    }

    const val = this.personalForm.getRawValue();
    this.isSavingPersonal.set(true);

    this.authService
      .updateProfile({
        firstName: val.firstName || '',
        lastName: val.lastName || '',
        phoneNumber: val.phoneNumber || undefined
      })
      .subscribe({
        next: (updatedProf) => {
          this.profile.set(updatedProf);
          this.personalSuccessMsg.set('تم تحديث البيانات الشخصية بنجاح');
          this.isSavingPersonal.set(false);
        },
        error: (err) => {
          console.error('Error updating profile:', err);
          this.personalErrorMsg.set('حدث خطأ أثناء تحديث البيانات الشخصية.');
          this.isSavingPersonal.set(false);
        }
      });
  }

  onSubmitPassword(): void {
    this.passwordSuccessMsg.set(null);
    this.passwordErrorMsg.set(null);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const val = this.passwordForm.getRawValue();
    this.isSavingPassword.set(true);

    this.authService
      .changePassword({
        currentPassword: val.currentPassword || '',
        newPassword: val.newPassword || ''
      })
      .subscribe({
        next: (res) => {
          this.passwordSuccessMsg.set(res.message || 'تم تغيير كلمة المرور بنجاح');
          this.passwordForm.reset();
          this.isSavingPassword.set(false);
        },
        error: (err) => {
          const msg = err?.error?.error || err?.error?.message || 'كلمة المرور الحالية غير صحيحة.';
          this.passwordErrorMsg.set(msg);
          this.isSavingPassword.set(false);
        }
      });
  }

  onSubmitAgent(): void {
    this.agentSuccessMsg.set(null);
    this.agentErrorMsg.set(null);

    const val = this.agentForm.getRawValue();
    this.isSavingAgent.set(true);

    this.agentService
      .updateMyProfile({
        bio: val.bio || undefined,
        publicPhone: val.publicPhone || undefined,
        agencyId: val.agencyId ? val.agencyId : null
      })
      .subscribe({
        next: () => {
          this.agentSuccessMsg.set('تم تحديث الملف المهني للوكيل بنجاح');
          this.isSavingAgent.set(false);
        },
        error: (err) => {
          console.error('Error updating agent profile:', err);
          this.agentErrorMsg.set('حدث خطأ أثناء تحديث الملف المهني.');
          this.isSavingAgent.set(false);
        }
      });
  }
}
