const { AppError } = require("../utils/appError");
const { ROLES } = require("../constants/roles");
const authRepo = require("../repositories/auth.repository");
const clinicsRepo = require("../repositories/clinics.repository");
const providerOnboardingRepo = require("../repositories/providerOnboarding.repository");
const { register } = require("./auth.service");

function ensureProvider(user) {
  if (!user || user.role !== ROLES.PROVIDER) {
    throw new AppError(403, "Зөвхөн үйлчилгээ үзүүлэгч энэ үйлдлийг хийнэ.");
  }
}

async function submitProviderOnboarding(user, payload) {
  ensureProvider(user);

  const authUser = await authRepo.findUserById(user.id);
  if (!authUser) {
    throw new AppError(404, "Хэрэглэгч олдсонгүй.");
  }

  if (authUser.email !== payload.account_email) {
    throw new AppError(400, "Аккаунтын имэйл нэвтэрсэн хэрэглэгчтэй тохирохгүй байна.");
  }

  await authRepo.updateUserOnboardingStatus(user.id, "pending");

  const submission = await providerOnboardingRepo.upsertSubmissionByUserId(user.id, payload);
  return {
    onboarding_status: "pending",
    submission,
  };
}

async function registerProviderWithOnboarding(payload) {
  const authResult = await register({
    full_name: payload.manager_name,
    email: payload.account_email,
    password: payload.password,
    role: ROLES.PROVIDER,
    phone: payload.account_phone,
  });

  const submissionPayload = { ...payload };
  delete submissionPayload.password;

  const submission = await providerOnboardingRepo.upsertSubmissionByUserId(authResult.user.id, submissionPayload);
  return {
    ...authResult,
    onboarding_status: "pending",
    submission,
  };
}

async function getProviderOnboardingStatus(user) {
  ensureProvider(user);
  const authUser = await authRepo.findUserById(user.id);
  if (!authUser) {
    throw new AppError(404, "Хэрэглэгч олдсонгүй.");
  }
  const submission = await providerOnboardingRepo.findSubmissionByUserId(user.id);
  return {
    onboarding_status: authUser.onboarding_status,
    admin_feedback: submission?.admin_feedback || null,
    submission,
  };
}

async function listPendingProviderSubmissions() {
  return providerOnboardingRepo.listPendingProvidersForAdmin();
}

function buildClinicDescription(submission) {
  return [`Төрөл: ${submission.clinic_type}`, submission.introduction].filter(Boolean).join("\n");
}

async function approveOrRejectProvider({ adminUser, providerUserId, decision, feedback }) {
  if (!adminUser || adminUser.role !== ROLES.SYSTEM_ADMIN) {
    throw new AppError(403, "Зөвхөн систем админ энэ үйлдлийг хийнэ.");
  }

  const targetUser = await authRepo.findUserById(providerUserId);
  if (!targetUser || targetUser.role !== ROLES.PROVIDER) {
    throw new AppError(404, "Баталгаажуулах үйлчилгээ үзүүлэгч олдсонгүй.");
  }

  const submission = await providerOnboardingRepo.findSubmissionByUserId(providerUserId);
  const pendingSubmission = submission && String(submission.status) === "pending" ? submission : null;

  if (pendingSubmission) {
    await providerOnboardingRepo.reviewSubmission({
      userId: providerUserId,
      reviewerId: adminUser.id,
      status: decision,
      feedback: feedback || null,
    });
  }

  await authRepo.updateUserOnboardingStatus(providerUserId, decision);

  if (decision === "approved" && pendingSubmission) {
    const existingClinic = await clinicsRepo.findClinicByOwnerUserId(providerUserId);
    if (!existingClinic) {
      await clinicsRepo.createClinic({
        owner_user_id: providerUserId,
        clinic_name: pendingSubmission.clinic_name,
        description: buildClinicDescription(pendingSubmission),
        address: pendingSubmission.address,
        city: pendingSubmission.city,
        clinic_type: pendingSubmission.clinic_type,
        phone: pendingSubmission.contact_phone,
        email: pendingSubmission.contact_email,
        approval_status: "approved",
      });
    }
  }

  const updatedUser = await authRepo.findUserById(providerUserId);
  const updatedSubmission = await providerOnboardingRepo.findSubmissionByUserId(providerUserId);
  return {
    user: updatedUser,
    submission: updatedSubmission,
  };
}

module.exports = {
  registerProviderWithOnboarding,
  submitProviderOnboarding,
  getProviderOnboardingStatus,
  listPendingProviderSubmissions,
  approveOrRejectProvider,
};

