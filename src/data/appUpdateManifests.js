/**
 * Embedded manifest registry for app updates.
 * Mirrors public/app-updates/<appId>/version.json
 * Stored here (inside src/) so Vercel serverless always bundles it.
 * readAppUpdateManifest() falls back to this when the filesystem file is absent.
 */
"use strict";

module.exports = {
  "app-bds-website-manager": {
    latestVersion: "2026.04.27",
    minimumSupportedVersion: "2026.04.27",
    required: false,
    title: "Ban desktop BDS hien tai dang on dinh",
    message: "Ban cai dat moi nhat cho Phan Mem Quan Ly Website & Tin Dang Bat Dong San da san sang trong khu vuc tai khoan.",
    notes: [
      "Ban desktop BDS duoc phat hanh qua Web Tong va kich hoat bang key trung tam",
      "Neu khong thay nut tai hoac key, vui long lien he ho tro de doi chieu entitlement"
    ],
    downloadPath: "/app-updates/app-bds-website-manager/Setup_BDS.exe",
    releaseNotesPath: "/app-updates/app-bds-website-manager/release-notes-2026.04.27.txt",
    publishedAt: "2026-04-27T02:31:17Z",
    sha256: "D7ADB80B83E832A66CE5AED5343BBE901BD29E440974DC87B151ACE208C386F3"
  },

  "app-prompt-image-video": {
    latestVersion: "1.0.4",
    minimumSupportedVersion: "1.0.4",
    required: false,
    title: "Ban Video Creator 1.0.4 da san sang",
    message: "Ban cai dat Video Creator 1.0.4 da san sang voi ban fix chan popup hoi quyen push trong browser nhung.",
    notes: [
      "Ban nay duoc phat hanh qua Web Tong va kich hoat bang key trung tam",
      "Neu khong thay nut tai hoac key, vui long lien he ho tro de doi chieu entitlement",
      "App hien tai phat hanh update qua Web Tong, chua co popup thong bao update tu dong trong app"
    ],
    downloadPath: "/app-updates/app-prompt-image-video/Setup_VideoCreator.exe",
    releaseNotesPath: "/app-updates/app-prompt-image-video/release-notes-2026.04.28-v2.txt",
    publishedAt: "2026-04-28T06:45:02Z",
    sha256: "AD06095AB1C0318F3C08C22C64C79841EB2FC812FECF9F358743CCD963AF08E2"
  },

  "app-study-12": {
    latestVersion: "0.1.2",
    minimumSupportedVersion: "0.1.0",
    required: false,
    title: "Hoc Hung Khoi Tieu Hoc - ban desktop moi nhat",
    message: "Ban desktop Windows da san sang. Bam Tai app Windows de tai bo cai moi nhat.",
    notes: [
      "Bo cai danh cho Windows x64.",
      "Sau khi cai dat, app se tu kiem tra cap nhat nen.",
      "Neu dang dung ban cu, hay cap nhat de nhan du tinh nang moi."
    ],
    downloadPath: "/app-updates/app-study-12/HocHungKhoi_Desktopapp-Win.exe",
    releaseNotesPath: "/app-updates/app-study-12/latest.yml",
    publishedAt: "2026-05-06T07:00:00Z"
  },

  "hair-spa-manager": {
    latestVersion: "1.0.0",
    minimumSupportedVersion: "1.0.0",
    required: false,
    title: "Ban desktop hien tai dang on dinh",
    message: "Manifest mau cho Hair Spa Manager. Khi co ban lon, cap nhat latestVersion, thong diep phat hanh va duong dan installer tai day.",
    notes: [
      "Ban nay duoc dung de noi updater voi Web Tong ma khong nhung logic key vao app",
      "Khi can khoa quyen update, chi can tra ve updateEntitlement tu backend"
    ],
    downloadPath: "/app-updates/hair-spa-manager/SalonManagerSetup-1.0.0.exe",
    releaseNotesPath: "/app-updates/hair-spa-manager/release-notes-1.0.0.txt",
    publishedAt: "2026-04-26T10:00:00Z",
    sha256: "PUT_REAL_SHA256_HERE"
  },

  "map-pro": {
    latestVersion: "7.9",
    minimumSupportedVersion: "7.9",
    required: false,
    title: "Phần Mềm Quét Data Khách Hàng Trên Google Map – bản 7.9",
    message: "Bản cài đặt mới nhất của GG Map Pro đã sẵn sàng. Tải về và giải nén toàn bộ thư mục trước khi chạy.",
    notes: [
      "Giải nén toàn bộ folder (không chạy thẳng file .exe từ trong zip)",
      "File Save_data/ui_cao_map_license_server.json chứa URL server kích hoạt – không xóa",
      "1 key kích hoạt được 1 máy (ID máy). Muốn chuyển máy liên hệ hỗ trợ"
    ],
    downloadPath: "/app-updates/map-pro/Setup_MapPro.exe",
    releaseNotesPath: "/app-updates/map-pro/release-notes-7.9.txt",
    publishedAt: "2026-04-27T00:00:00Z",
    sha256: "4C280E4C3EB043DEAA5B413B394A8D252EAB9F7A0762B9D2E33750FA0F08D509"
  }
};
