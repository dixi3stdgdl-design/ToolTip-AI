using System;
using System.Security.Cryptography;
using System.Text;

namespace ToolTipAI;

public static class VaultManager
{
    private static readonly byte[] PrimaryEntropy = Encoding.UTF8.GetBytes("ToolTipAI.Vault.Entropy.v1");
    private static readonly byte[] LegacyEntropy = Encoding.UTF8.GetBytes("TeachMeAI.Vault.Entropy.v1");

    public static string EncryptSecret(string plainText)
    {
        if (string.IsNullOrEmpty(plainText)) return string.Empty;

        try
        {
            byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);
            byte[] encryptedBytes = ProtectedData.Protect(
                plainBytes,
                PrimaryEntropy,
                DataProtectionScope.CurrentUser
            );
            return Convert.ToBase64String(encryptedBytes);
        }
        catch
        {
            return string.Empty;
        }
    }

    /// <summary>
    /// Decrypts a DPAPI-protected secret. Returns null if the value is not valid ciphertext
    /// (callers should treat that as "no key stored").
    /// </summary>
    public static string? TryDecryptSecret(string cipherText)
    {
        if (string.IsNullOrWhiteSpace(cipherText)) return null;

        try
        {
            byte[] encryptedBytes = Convert.FromBase64String(cipherText);
            try
            {
                byte[] plainBytes = ProtectedData.Unprotect(
                    encryptedBytes,
                    PrimaryEntropy,
                    DataProtectionScope.CurrentUser
                );
                return Encoding.UTF8.GetString(plainBytes);
            }
            catch
            {
                // Fallback for seamless migration of older vault keys
                byte[] legacyBytes = ProtectedData.Unprotect(
                    encryptedBytes,
                    LegacyEntropy,
                    DataProtectionScope.CurrentUser
                );
                return Encoding.UTF8.GetString(legacyBytes);
            }
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// One-shot migration for legacy plaintext keys (pre-DPAPI configs).
    /// Returns the plaintext so the caller can re-encrypt and rewrite settings immediately.
    /// </summary>
    public static bool TryMigrateLegacyPlaintext(string storedValue, out string plainText)
    {
        plainText = string.Empty;
        if (string.IsNullOrWhiteSpace(storedValue)) return false;

        if (storedValue.StartsWith("AIzaSy", StringComparison.Ordinal) ||
            storedValue.StartsWith("AQ.", StringComparison.Ordinal))
        {
            plainText = storedValue;
            return true;
        }

        return false;
    }
}
