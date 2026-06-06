#!/usr/bin/env bash
# /opt/outreach/send.sh  TO  SUBJECT  BODY_HTML_FILE
# Sends one HTML email via local Postfix (OpenDKIM milter auto-signs out2026).
# Used by the n8n Affiliate-Recruiter workflow (SSH-exec) after the Telegram approval gate.
set -euo pipefail

TO="${1:?usage: send.sh TO SUBJECT BODYFILE}"
SUBJECT="${2:?subject required}"
BODYFILE="${3:?body html file required}"

FROM="Danny from Little Souls <danny@outreach.littlesouls.app>"
ENVELOPE="danny@outreach.littlesouls.app"
UNSUB="<mailto:unsubscribe@outreach.littlesouls.app?subject=unsubscribe>, <https://littlesouls.app/unsubscribe>"

# MIME-encode the subject (RFC 2047) so emoji / non-ASCII never trigger SMTPUTF8,
# which bounces at MXs that do not offer it (e.g. simplelogin/passmail).
SUBJECT_ENC="=?UTF-8?B?$(printf '%s' "${SUBJECT}" | base64 -w0)?="

{
  echo "From: ${FROM}"
  echo "To: ${TO}"
  echo "Subject: ${SUBJECT_ENC}"
  echo "MIME-Version: 1.0"
  echo "Content-Type: text/html; charset=UTF-8"
  echo "List-Unsubscribe: ${UNSUB}"
  echo "List-Unsubscribe-Post: List-Unsubscribe=One-Click"
  echo ""
  cat "${BODYFILE}"
} | /usr/sbin/sendmail -f "${ENVELOPE}" -t

echo "SENT to ${TO}"
