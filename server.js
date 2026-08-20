const express = require('express');
const cors = require('cors');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper function to draw a certificate
async function generateCertificate(recipient) {
    const width = 1920;
    const height = 1080;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Try to load template image, if it doesn't exist, use a blank white canvas
    const templatePath = path.join(__dirname, 'Certificate.jpg');
    try {
        if (fs.existsSync(templatePath)) {
            const templateImage = await loadImage(templatePath);
            ctx.drawImage(templateImage, 0, 0, width, height);
        } else {
            // Default blank background if no template.png is provided
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            
            // Draw a basic border
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 10;
            ctx.strokeRect(50, 50, width - 100, height - 100);
        }
    } catch (err) {
        console.error("Error loading template image:", err);
    }

    // Default coordinates and styling (You can adjust these based on your template)
    ctx.textAlign = 'center';
    
    // Draw Name
    ctx.font = 'bold 80px Arial';
    ctx.fillStyle = '#000000';
    ctx.fillText(recipient.Name || 'Name', width / 2, 450);

    // Draw Course
    ctx.font = '50px Arial';
    ctx.fillStyle = '#555555';
    ctx.fillText(recipient.Course || 'Course Name', width / 2, 600);

    // Draw Date
    ctx.font = '40px Arial';
    ctx.fillStyle = '#333333';
    ctx.fillText(`Date: ${recipient.Date || 'DD/MM/YYYY'}`, width / 2, 750);

    // Draw Credential ID
    ctx.font = '30px Arial';
    ctx.fillStyle = '#777777';
    ctx.fillText(`ID: ${recipient.CredentialID || 'XXXXXX'}`, width / 2, 850);

    // Return as Base64 string
    return canvas.toDataURL('image/png');
}

// POST endpoint to generate certificates
app.post('/generate', async (req, res) => {
    try {
        const { recipients, format } = req.body;
        
        if (!recipients || !Array.isArray(recipients)) {
            return res.status(400).json({ error: "Invalid payload: 'recipients' must be an array." });
        }

        console.log(`Generating certificates for ${recipients.length} recipients...`);
        
        const generatedImages = [];
        for (const recipient of recipients) {
            const base64Image = await generateCertificate(recipient);
            generatedImages.push({
                name: recipient.Name,
                course: recipient.Course,
                credentialId: recipient.CredentialID,
                image: base64Image
            });
        }

        console.log("Successfully generated all certificates.");
        
        // Return JSON array containing Base64 encoded images
        res.json({
            success: true,
            count: generatedImages.length,
            certificates: generatedImages
        });
        
    } catch (error) {
        console.error("Error generating certificates:", error);
        res.status(500).json({ error: "Internal server error generating certificates." });
    }
});

// GET endpoint to check server status
app.get('/status', (req, res) => {
    res.json({ status: "API is running!" });
});

app.listen(PORT, () => {
    console.log(`Certificate generation API is running on http://localhost:${PORT}`);
    console.log(`Waiting for POST requests at http://localhost:${PORT}/generate`);
});
