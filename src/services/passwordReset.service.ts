interface ResetCode {
  email: string;
  code: string;
  expiresAt: Date;
}

class PasswordResetService {
  private resetCodes: Map<string, ResetCode> = new Map();

  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  storeCode(email: string, code: string): void {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    this.resetCodes.set(email, {
      email,
      code,
      expiresAt
    });
  }

  verifyCode(email: string, code: string): boolean {
    const resetData = this.resetCodes.get(email);

    if (!resetData) {
      return false;
    }

    if (new Date() > resetData.expiresAt) {
      this.resetCodes.delete(email);
      return false;
    }

    return resetData.code === code;
  }

  removeCode(email: string): void {
    this.resetCodes.delete(email);
  }

  cleanExpiredCodes(): void {
    const now = new Date();
    for (const [email, resetData] of this.resetCodes.entries()) {
      if (now > resetData.expiresAt) {
        this.resetCodes.delete(email);
      }
    }
  }
}

export default new PasswordResetService();
