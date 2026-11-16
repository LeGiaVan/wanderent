/* Trang Ưu đãi HSSV — tải ảnh thẻ để admin duyệt */
(function () {
  "use strict";
  WR.initPage("student");
  const user = WR.currentUser();
  WR.renderStudentForm(document.getElementById("student-form"), {
    email: user && user.role !== "admin" ? user.email : "",
    name: user && user.role !== "admin" ? user.name : "",
    onEmail: (email) => { document.getElementById("lookup-email").value = email; },
  });
  document.getElementById("lookup").addEventListener("submit", (e) => {
    e.preventDefault();
    const rec = WR.studentOf(document.getElementById("lookup-email").value);
    const out = document.getElementById("lookup-out");
    if (!rec) { out.textContent = "Chưa có yêu cầu xác minh nào với email này."; return; }
    const st = WR.STUDENT_STATUS[rec.status];
    out.textContent = `${st.label} · gửi ngày ${WR.fmtDate(WR.toISO(rec.submittedAt))}${rec.note ? " · " + rec.note : ""}`;
  });
})();
