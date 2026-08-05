# Playnira Supabase Email Templates

Use these in Supabase Dashboard -> Authentication -> Emails -> Templates.

Keep SMTP sender details as:

- Sender name: `Playnira`
- Sender email: `playnira.app.mail@gmail.com`

Each template below has a subject and a full HTML body. Paste only the HTML into the Body editor.

## Confirm Sign Up

Subject:

```text
Confirm your Playnira account
```

Body:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Confirm your Playnira account</title>
  </head>
  <body
    style="margin:0;background:#101417;color:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;"
  >
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;">
      One click and your Playnira journey starts.
    </div>
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      style="background:#101417;padding:28px 12px;"
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="max-width:640px;background:#182027;border:1px solid #334151;border-radius:16px;overflow:hidden;"
          >
            <tr>
              <td style="padding:28px 28px 12px;">
                <div
                  style="display:inline-block;background:#67e8f9;color:#071014;border-radius:10px;padding:8px 11px;font-weight:900;"
                >
                  Playnira
                </div>
                <h1
                  style="margin:24px 0 0;font-size:30px;line-height:1.15;color:#ffffff;"
                >
                  Confirm your account
                </h1>
                <p
                  style="margin:10px 0 0;color:#aebbd0;font-size:16px;line-height:1.6;"
                >
                  Your games. Your journey.
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="padding:0 28px 22px;color:#cbd5e1;font-size:16px;line-height:1.65;"
              >
                <p style="margin:0 0 18px;">
                  Welcome to Playnira. Confirm your email address to start
                  rating games, organizing your backlog, and discovering what to
                  play next.
                </p>
                <p style="margin:0;">
                  This link expires soon and can only be used once.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 30px;">
                <a
                  href="{{ .ConfirmationURL }}"
                  style="display:inline-block;background:#39dc86;color:#07110d;text-decoration:none;font-weight:900;border-radius:10px;padding:14px 18px;"
                  >Confirm email</a
                >
              </td>
            </tr>
            <tr>
              <td
                style="border-top:1px solid #334151;padding:18px 28px;color:#94a3b8;font-size:12px;line-height:1.55;"
              >
                If the button does not work, copy and paste this link into your
                browser:<br />
                <a
                  href="{{ .ConfirmationURL }}"
                  style="color:#67e8f9;word-break:break-all;"
                  >{{ .ConfirmationURL }}</a
                ><br /><br />
                If you did not create a Playnira account, you can ignore this
                email. If you cannot find Playnira emails later, check your junk
                or spam folder too.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Reset Password

Subject:

```text
Reset your Playnira password
```

Body:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Reset your Playnira password</title>
  </head>
  <body
    style="margin:0;background:#101417;color:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;"
  >
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;">
      Use this secure link to choose a new Playnira password.
    </div>
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      style="background:#101417;padding:28px 12px;"
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="max-width:640px;background:#182027;border:1px solid #334151;border-radius:16px;overflow:hidden;"
          >
            <tr>
              <td style="padding:28px 28px 12px;">
                <div
                  style="display:inline-block;background:#67e8f9;color:#071014;border-radius:10px;padding:8px 11px;font-weight:900;"
                >
                  Playnira
                </div>
                <h1
                  style="margin:24px 0 0;font-size:30px;line-height:1.15;color:#ffffff;"
                >
                  Reset your password
                </h1>
                <p
                  style="margin:10px 0 0;color:#aebbd0;font-size:16px;line-height:1.6;"
                >
                  Secure your game journey.
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="padding:0 28px 22px;color:#cbd5e1;font-size:16px;line-height:1.65;"
              >
                <p style="margin:0 0 18px;">
                  We received a request to reset the password for this Playnira
                  account.
                </p>
                <p style="margin:0;">
                  Use the button below to choose a new password. This link
                  expires soon and can only be used once.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 30px;">
                <a
                  href="{{ .ConfirmationURL }}"
                  style="display:inline-block;background:#39dc86;color:#07110d;text-decoration:none;font-weight:900;border-radius:10px;padding:14px 18px;"
                  >Reset password</a
                >
              </td>
            </tr>
            <tr>
              <td
                style="border-top:1px solid #334151;padding:18px 28px;color:#94a3b8;font-size:12px;line-height:1.55;"
              >
                If the button does not work, copy and paste this link into your
                browser:<br />
                <a
                  href="{{ .ConfirmationURL }}"
                  style="color:#67e8f9;word-break:break-all;"
                  >{{ .ConfirmationURL }}</a
                ><br /><br />
                If you did not request this, you can safely ignore this email.
                If you cannot find Playnira emails later, check your junk or
                spam folder too.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Magic Link

Subject:

```text
Your Playnira sign-in link
```

Body:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Your Playnira sign-in link</title>
  </head>
  <body
    style="margin:0;background:#101417;color:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;"
  >
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;">
      Sign in to Playnira with this secure link.
    </div>
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      style="background:#101417;padding:28px 12px;"
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="max-width:640px;background:#182027;border:1px solid #334151;border-radius:16px;overflow:hidden;"
          >
            <tr>
              <td style="padding:28px 28px 12px;">
                <div
                  style="display:inline-block;background:#67e8f9;color:#071014;border-radius:10px;padding:8px 11px;font-weight:900;"
                >
                  Playnira
                </div>
                <h1
                  style="margin:24px 0 0;font-size:30px;line-height:1.15;color:#ffffff;"
                >
                  Sign in to Playnira
                </h1>
                <p
                  style="margin:10px 0 0;color:#aebbd0;font-size:16px;line-height:1.6;"
                >
                  Your games. Your journey.
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="padding:0 28px 22px;color:#cbd5e1;font-size:16px;line-height:1.65;"
              >
                <p style="margin:0 0 18px;">
                  Use this secure link to sign in and continue tracking your
                  games.
                </p>
                <p style="margin:0;">
                  This link expires soon and can only be used once.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 30px;">
                <a
                  href="{{ .ConfirmationURL }}"
                  style="display:inline-block;background:#39dc86;color:#07110d;text-decoration:none;font-weight:900;border-radius:10px;padding:14px 18px;"
                  >Sign in</a
                >
              </td>
            </tr>
            <tr>
              <td
                style="border-top:1px solid #334151;padding:18px 28px;color:#94a3b8;font-size:12px;line-height:1.55;"
              >
                If the button does not work, copy and paste this link into your
                browser:<br />
                <a
                  href="{{ .ConfirmationURL }}"
                  style="color:#67e8f9;word-break:break-all;"
                  >{{ .ConfirmationURL }}</a
                ><br /><br />
                If you did not ask for this link, you can ignore this email. If
                you cannot find Playnira emails later, check your junk or spam
                folder too.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Invite User

Subject:

```text
You are invited to Playnira
```

Body:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>You are invited to Playnira</title>
  </head>
  <body
    style="margin:0;background:#101417;color:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;"
  >
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;">
      Join Playnira and start building your game journey.
    </div>
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      style="background:#101417;padding:28px 12px;"
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="max-width:640px;background:#182027;border:1px solid #334151;border-radius:16px;overflow:hidden;"
          >
            <tr>
              <td style="padding:28px 28px 12px;">
                <div
                  style="display:inline-block;background:#67e8f9;color:#071014;border-radius:10px;padding:8px 11px;font-weight:900;"
                >
                  Playnira
                </div>
                <h1
                  style="margin:24px 0 0;font-size:30px;line-height:1.15;color:#ffffff;"
                >
                  You are invited
                </h1>
                <p
                  style="margin:10px 0 0;color:#aebbd0;font-size:16px;line-height:1.6;"
                >
                  Discover, rate, and organize your games.
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="padding:0 28px 22px;color:#cbd5e1;font-size:16px;line-height:1.65;"
              >
                <p style="margin:0 0 18px;">
                  You have been invited to Playnira, a game tracking community
                  built around your taste, your backlog, and your next great
                  game.
                </p>
                <p style="margin:0;">
                  Accept the invite to create your account.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 30px;">
                <a
                  href="{{ .ConfirmationURL }}"
                  style="display:inline-block;background:#39dc86;color:#07110d;text-decoration:none;font-weight:900;border-radius:10px;padding:14px 18px;"
                  >Accept invite</a
                >
              </td>
            </tr>
            <tr>
              <td
                style="border-top:1px solid #334151;padding:18px 28px;color:#94a3b8;font-size:12px;line-height:1.55;"
              >
                If the button does not work, copy and paste this link into your
                browser:<br />
                <a
                  href="{{ .ConfirmationURL }}"
                  style="color:#67e8f9;word-break:break-all;"
                  >{{ .ConfirmationURL }}</a
                ><br /><br />
                If you were not expecting this invite, you can ignore this
                email. If you cannot find Playnira emails later, check your junk
                or spam folder too.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Change Email Address

Subject:

```text
Confirm your Playnira email change
```

Body:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Confirm your Playnira email change</title>
  </head>
  <body
    style="margin:0;background:#101417;color:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;"
  >
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;">
      Confirm this email address for your Playnira account.
    </div>
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      style="background:#101417;padding:28px 12px;"
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="max-width:640px;background:#182027;border:1px solid #334151;border-radius:16px;overflow:hidden;"
          >
            <tr>
              <td style="padding:28px 28px 12px;">
                <div
                  style="display:inline-block;background:#67e8f9;color:#071014;border-radius:10px;padding:8px 11px;font-weight:900;"
                >
                  Playnira
                </div>
                <h1
                  style="margin:24px 0 0;font-size:30px;line-height:1.15;color:#ffffff;"
                >
                  Confirm email change
                </h1>
                <p
                  style="margin:10px 0 0;color:#aebbd0;font-size:16px;line-height:1.6;"
                >
                  Protect your account details.
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="padding:0 28px 22px;color:#cbd5e1;font-size:16px;line-height:1.65;"
              >
                <p style="margin:0 0 18px;">
                  A request was made to use this email address for your Playnira
                  account.
                </p>
                <p style="margin:0;">
                  Confirm the change only if you made this request.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 30px;">
                <a
                  href="{{ .ConfirmationURL }}"
                  style="display:inline-block;background:#39dc86;color:#07110d;text-decoration:none;font-weight:900;border-radius:10px;padding:14px 18px;"
                  >Confirm email change</a
                >
              </td>
            </tr>
            <tr>
              <td
                style="border-top:1px solid #334151;padding:18px 28px;color:#94a3b8;font-size:12px;line-height:1.55;"
              >
                If the button does not work, copy and paste this link into your
                browser:<br />
                <a
                  href="{{ .ConfirmationURL }}"
                  style="color:#67e8f9;word-break:break-all;"
                  >{{ .ConfirmationURL }}</a
                ><br /><br />
                If you did not request this change, secure your account and
                ignore this email. If you cannot find Playnira emails later,
                check your junk or spam folder too.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Reauthentication

Subject:

```text
Your Playnira security code
```

Body:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Your Playnira security code</title>
  </head>
  <body
    style="margin:0;background:#101417;color:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;"
  >
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;">
      Use this code to continue in Playnira.
    </div>
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      style="background:#101417;padding:28px 12px;"
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="max-width:640px;background:#182027;border:1px solid #334151;border-radius:16px;overflow:hidden;"
          >
            <tr>
              <td style="padding:28px 28px 12px;">
                <div
                  style="display:inline-block;background:#67e8f9;color:#071014;border-radius:10px;padding:8px 11px;font-weight:900;"
                >
                  Playnira
                </div>
                <h1
                  style="margin:24px 0 0;font-size:30px;line-height:1.15;color:#ffffff;"
                >
                  Security check
                </h1>
                <p
                  style="margin:10px 0 0;color:#aebbd0;font-size:16px;line-height:1.6;"
                >
                  Confirm it is really you.
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="padding:0 28px 22px;color:#cbd5e1;font-size:16px;line-height:1.65;"
              >
                <p style="margin:0 0 18px;">
                  Use this code to continue with your Playnira account:
                </p>
                <div
                  style="display:inline-block;background:#0b0f12;border:1px solid #334151;border-radius:12px;padding:14px 18px;color:#ffffff;font-size:30px;font-weight:900;letter-spacing:6px;"
                >
                  {{ .Token }}
                </div>
                <p style="margin:18px 0 0;">
                  This code expires soon. Do not share it with anyone.
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="border-top:1px solid #334151;padding:18px 28px;color:#94a3b8;font-size:12px;line-height:1.55;"
              >
                If you did not request this code, you can ignore this email. If
                you cannot find Playnira emails later, check your junk or spam
                folder too.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Email OTP

Use this if your Supabase project shows a separate Email OTP template.

Subject:

```text
Your Playnira verification code
```

Body:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Your Playnira verification code</title>
  </head>
  <body
    style="margin:0;background:#101417;color:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;"
  >
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;">
      Use this code to verify your Playnira sign-in.
    </div>
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      style="background:#101417;padding:28px 12px;"
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="max-width:640px;background:#182027;border:1px solid #334151;border-radius:16px;overflow:hidden;"
          >
            <tr>
              <td style="padding:28px 28px 12px;">
                <div
                  style="display:inline-block;background:#67e8f9;color:#071014;border-radius:10px;padding:8px 11px;font-weight:900;"
                >
                  Playnira
                </div>
                <h1
                  style="margin:24px 0 0;font-size:30px;line-height:1.15;color:#ffffff;"
                >
                  Verification code
                </h1>
                <p
                  style="margin:10px 0 0;color:#aebbd0;font-size:16px;line-height:1.6;"
                >
                  Your games. Your journey.
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="padding:0 28px 22px;color:#cbd5e1;font-size:16px;line-height:1.65;"
              >
                <p style="margin:0 0 18px;">
                  Enter this code to continue with Playnira:
                </p>
                <div
                  style="display:inline-block;background:#0b0f12;border:1px solid #334151;border-radius:12px;padding:14px 18px;color:#ffffff;font-size:30px;font-weight:900;letter-spacing:6px;"
                >
                  {{ .Token }}
                </div>
                <p style="margin:18px 0 0;">
                  This code expires soon and can only be used once.
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="border-top:1px solid #334151;padding:18px 28px;color:#94a3b8;font-size:12px;line-height:1.55;"
              >
                If you did not request this code, you can ignore this email. If
                you cannot find Playnira emails later, check your junk or spam
                folder too.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```
