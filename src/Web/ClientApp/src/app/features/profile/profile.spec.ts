import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../core/models/auth.model';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let component: ProfileComponent;
  let authService: AuthService;
  let httpMock: HttpTestingController;

  const mockProfile: UserProfile = {
    id: 'usr-100',
    email: 'testuser@aleppo.com',
    firstName: 'أحمد',
    lastName: 'الحلبي',
    phoneNumber: '+963911222333',
    role: 'Buyer',
    createdAt: '2026-09-28T09:00:00Z'
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        AuthService,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    authService.currentUser.set({
      id: 'usr-100',
      email: 'testuser@aleppo.com',
      firstName: 'أحمد',
      lastName: 'الحلبي',
      role: 'Buyer'
    });

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create component and load profile on init', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/users/profile');
    expect(req.request.method).toBe('GET');
    req.flush(mockProfile);

    fixture.detectChanges();

    expect(component.isLoadingProfile()).toBe(false);
    expect(component.profile()?.firstName).toBe('أحمد');
    expect(component.personalForm.value.firstName).toBe('أحمد');
    expect(component.personalForm.value.lastName).toBe('الحلبي');
  });

  it('should switch active tabs correctly', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/users/profile').flush(mockProfile);

    expect(component.activeTab()).toBe('personal');
    component.setTab('security');
    expect(component.activeTab()).toBe('security');
  });

  it('should validate required fields in personal form', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/users/profile').flush(mockProfile);

    component.personalForm.controls.firstName.setValue('');
    component.personalForm.controls.lastName.setValue('');

    component.onSubmitPersonal();

    expect(component.personalForm.valid).toBe(false);
    expect(component.personalForm.controls.firstName.hasError('required')).toBe(true);
    expect(component.personalForm.controls.lastName.hasError('required')).toBe(true);
  });

  it('should submit updated personal information successfully', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/users/profile').flush(mockProfile);

    component.personalForm.patchValue({
      firstName: 'خالد',
      lastName: 'النجار',
      phoneNumber: '+963955111222'
    });

    component.onSubmitPersonal();

    const updateReq = httpMock.expectOne('/api/users/profile');
    expect(updateReq.request.method).toBe('PUT');
    expect(updateReq.request.body).toEqual({
      firstName: 'خالد',
      lastName: 'النجار',
      phoneNumber: '+963955111222'
    });

    const updatedProfile: UserProfile = { ...mockProfile, firstName: 'خالد', lastName: 'النجار', phoneNumber: '+963955111222' };
    updateReq.flush(updatedProfile);

    fixture.detectChanges();

    expect(component.personalSuccessMsg()).toBe('تم تحديث البيانات الشخصية بنجاح');
    expect(authService.currentUser()?.firstName).toBe('خالد');
  });

  it('should validate password form matching and length policies', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/users/profile').flush(mockProfile);

    component.setTab('security');
    component.passwordForm.patchValue({
      currentPassword: '',
      newPassword: '123',
      confirmPassword: '456'
    });

    component.onSubmitPassword();

    expect(component.passwordForm.valid).toBe(false);
    expect(component.passwordForm.controls.currentPassword.hasError('required')).toBe(true);
    expect(component.passwordForm.controls.newPassword.hasError('minlength')).toBe(true);
    expect(component.passwordForm.hasError('passwordMismatch')).toBe(true);
  });

  it('should submit password change successfully when form is valid', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/users/profile').flush(mockProfile);

    component.setTab('security');
    component.passwordForm.patchValue({
      currentPassword: 'CurrentPass123!',
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!'
    });

    component.onSubmitPassword();

    const changeReq = httpMock.expectOne('/api/users/change-password');
    expect(changeReq.request.method).toBe('PUT');
    expect(changeReq.request.body).toEqual({
      currentPassword: 'CurrentPass123!',
      newPassword: 'NewPassword123!'
    });

    changeReq.flush({ message: 'تم تغيير كلمة المرور بنجاح.' });

    fixture.detectChanges();

    expect(component.passwordSuccessMsg()).toBe('تم تغيير كلمة المرور بنجاح.');
  });

  it('should display error alert when current password is wrong', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/users/profile').flush(mockProfile);

    component.setTab('security');
    component.passwordForm.patchValue({
      currentPassword: 'WrongPassword!',
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!'
    });

    component.onSubmitPassword();

    const changeReq = httpMock.expectOne('/api/users/change-password');
    changeReq.flush({ error: 'كلمة المرور الحالية غير صحيحة.' }, { status: 400, statusText: 'Bad Request' });

    fixture.detectChanges();

    expect(component.passwordErrorMsg()).toBe('كلمة المرور الحالية غير صحيحة.');
  });
});
