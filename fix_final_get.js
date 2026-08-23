const fs = require('fs');
let configCode = fs.readFileSync('src/app/api/empresa/config/route.ts', 'utf8');

const regex = /return NextResponse\.json\(\{\s*success: true,\s*data: dashboardData,\s*onboardingData\s*\}, \{ status: 200 \}\);/;

const replacement = `return NextResponse.json({
        success: true,
        data: dashboardData,
        is_active: (() => {
          try {
            const parsed = typeof siteClinic?.dados_completos_json === 'string' ? JSON.parse(siteClinic.dados_completos_json) : (siteClinic?.dados_completos_json || {});
            return parsed.is_active !== false;
          } catch(e) { return true; }
        })(),
        onboardingData
      }, { status: 200 });`;

if (configCode.match(regex)) {
  configCode = configCode.replace(regex, replacement);
  fs.writeFileSync('src/app/api/empresa/config/route.ts', configCode);
  console.log("Injected is_active correctly into final GET response");
} else {
  console.log("Could not match the final NextResponse.json block!");
}
