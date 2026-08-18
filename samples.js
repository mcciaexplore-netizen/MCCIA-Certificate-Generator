/**
 * samples.js
 * Generates a premium, high-resolution certificate template image using HTML5 Canvas.
 * This enables the user to test the generator instantly without uploading an external template.
 */

function generateSampleTemplate() {
  return new Promise((resolve) => {
    let resolved = false;
    
    function draw() {
      if (resolved) return;
      resolved = true;
      
      const canvas = document.createElement('canvas');
      canvas.width = 2000;
      canvas.height = 1414; // A4 standard ratio (approx 1.414)
      const ctx = canvas.getContext('2d');

      // 1. Draw Background (Cream / Off-white)
      ctx.fillStyle = '#fdfbf7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add a very subtle gradient overlay for depth
      const bgGrad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 200,
        canvas.width / 2, canvas.height / 2, 1000
      );
      bgGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      bgGrad.addColorStop(1, 'rgba(212, 175, 55, 0.04)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw Outer Borders (Deep Navy Slate)
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 16;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

      // Inset Thin Gold Border
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

      // Inner Navy Border (double line style)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(62, 62, canvas.width - 124, canvas.height - 124);

      // 3. Draw Corner Decorative Brackets (Gold)
      const drawCorner = (x, y, xDir, yDir) => {
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 6;
        ctx.beginPath();
        // Corner bracket lines
        ctx.moveTo(x, y + (yDir * 60));
        ctx.lineTo(x, y);
        ctx.lineTo(x + (xDir * 60), y);
        ctx.stroke();

        // Corner dot
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(x + (xDir * 24), y + (yDir * 24), 6, 0, Math.PI * 2);
        ctx.fill();
      };

      // Top-Left, Top-Right, Bottom-Left, Bottom-Right
      drawCorner(85, 85, 1, 1);
      drawCorner(canvas.width - 85, 85, -1, 1);
      drawCorner(85, canvas.height - 85, 1, -1);
      drawCorner(canvas.width - 85, canvas.height - 85, -1, -1);

      // 4. Draw Header Certificate Title
      ctx.textAlign = 'center';
      
      // "CERTIFICATE"
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 76px "Cinzel", serif';
      ctx.fillText('CERTIFICATE', canvas.width / 2, 280);

      // "OF ACHIEVEMENT"
      ctx.fillStyle = '#b48a1c'; // Brushed Gold
      ctx.font = '600 24px "Montserrat", sans-serif';
      ctx.fillText('O F   A C H I E V E M E N T', canvas.width / 2, 340);

      // Subtle gold separator line
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 120, 380);
      ctx.lineTo(canvas.width / 2 + 120, 380);
      ctx.stroke();

      // 5. Draw Dynamic Text Static Background Labels (For context)
      // "This is proudly presented to"
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 500 22px "Playfair Display", serif';
      ctx.fillText('This certificate is proudly presented to', canvas.width / 2, 490);

      // (The dynamic Name element will be placed around y=580)
      
      // "for successful completion of"
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 500 20px "Playfair Display", serif';
      ctx.fillText('for successfully completing the course requirements and demonstrating proficiency in', canvas.width / 2, 720);

      // (The dynamic Course element will be placed around y=810)

      // "Under instruction of"
      ctx.fillStyle = '#64748b';
      ctx.font = '400 18px "Inter", sans-serif';
      ctx.fillText('under the supervision and certification of CertifyFlow Academy', canvas.width / 2, 910);

      // 6. Draw Footer Signature & Date Lines
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;

      // Signature line (Left)
      const sigLineX = 350;
      const sigLineW = 320;
      const sigY = 1140;
      ctx.beginPath();
      ctx.moveTo(sigLineX, sigY);
      ctx.lineTo(sigLineX + sigLineW, sigY);
      ctx.stroke();

      // Signature label
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 15px "Montserrat", sans-serif';
      ctx.fillText('AUTHORIZED SIGNATURE', sigLineX + (sigLineW / 2), sigY + 30);

      // Fake handwritten signature
      ctx.fillStyle = '#1e3a8a'; // Blue ink color
      ctx.font = '48px "Alex Brush", cursive';
      ctx.fillText('Sarah Jenkins', sigLineX + (sigLineW / 2), sigY - 20);

      // Date line (Right)
      const dateLineX = canvas.width - 350 - 320;
      const dateLineW = 320;
      ctx.beginPath();
      ctx.moveTo(dateLineX, sigY);
      ctx.lineTo(dateLineX + dateLineW, sigY);
      ctx.stroke();

      // Date label
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 15px "Montserrat", sans-serif';
      ctx.fillText('DATE ISSUED', dateLineX + (dateLineW / 2), sigY + 30);

      // 7. Draw a Premium Gold Foil Seal (Center Bottom)
      const sealX = canvas.width / 2;
      const sealY = 1110;
      const sealR = 64;

      // Draw starburst spikes
      ctx.fillStyle = '#d4af37';
      ctx.save();
      ctx.translate(sealX, sealY);
      for (let i = 0; i < 40; i++) {
        ctx.rotate(Math.PI / 20);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-12, -sealR - 10);
        ctx.lineTo(0, -sealR - 4);
        ctx.lineTo(12, -sealR - 10);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Base seal outer circle (gold gradient)
      const goldGrad = ctx.createRadialGradient(sealX, sealY, 10, sealX, sealY, sealR);
      goldGrad.addColorStop(0, '#fef08a'); // Bright gold
      goldGrad.addColorStop(0.5, '#e2b042'); // Gold
      goldGrad.addColorStop(1, '#b48a1c'); // Dark gold
      
      ctx.fillStyle = goldGrad;
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
      ctx.fill();

      // Inset dark navy circle border inside the seal
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR - 8, 0, Math.PI * 2);
      ctx.stroke();

      // Gold fill for seal inner area
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR - 11, 0, Math.PI * 2);
      ctx.fill();

      // Decorative stars / ribbon inside
      ctx.fillStyle = '#ffffff';
      ctx.font = '22px "Font Awesome 6 Free"';
      ctx.fillText('★ ★ ★', sealX, sealY + 8);

      // Return the image data URL
      resolve(canvas.toDataURL('image/png'));
    }
    
    // Trigger immediately on fonts ready
    document.fonts.ready.then(draw).catch(draw);
    
    // Failsafe backup timeout of 800ms
    setTimeout(draw, 800);
  });
}
