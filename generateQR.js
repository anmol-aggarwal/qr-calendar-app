const QRCode = require("qrcode");
const fs = require("fs");

// Load the local JSON mapping
const mapping = require("./app/mediaMapping.json");

async function generateQRCodes() {
  // Ensure the "qrcodes" folder exists
  const qrDir = "./qrcodes";
  if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir);
  }

  for (const docID of Object.keys(mapping)) {
    const outputPath = `${qrDir}/${docID}.png`;

    // The QR code will store just the docID (short & clean)
    await QRCode.toFile(outputPath, docID, {
      color: {
        dark: "#000000",  // QR code color
        light: "#ffffff"  // background
      }
    });

    console.log(`✅ QR code generated for ${docID} → ${outputPath}`);
  }
}

generateQRCodes();
