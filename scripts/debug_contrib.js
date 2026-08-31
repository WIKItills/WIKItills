const https = require('https');

https.get('https://github.com/users/WIKItills/contributions', {
  headers: { 'User-Agent': 'profile-readme-bot/1.0' }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('HTML length:', d.length);

    // Try data-date
    const dates = d.match(/data-date="\d{4}-\d{2}-\d{2}"/g);
    console.log('data-date matches:', dates ? dates.length : 0);

    // Try data-level
    const levels = d.match(/data-level="[^"]+"/g);
    console.log('data-level matches:', levels ? levels.length : 0);
    if (levels) console.log('Sample levels:', levels.slice(0, 5));

    // Try ContributionCalendar-day
    const cells = d.match(/ContributionCalendar-day/g);
    console.log('ContributionCalendar-day:', cells ? cells.length : 0);

    // Try tool-tip
    const tips = d.match(/tool-tip/g);
    console.log('tool-tip matches:', tips ? tips.length : 0);

    // Show a small slice of the HTML to see the format
    const idx = d.indexOf('ContributionCalendar');
    if (idx > -1) {
      console.log('\n--- HTML snippet ---');
      console.log(d.substring(idx, idx + 800));
    } else {
      console.log('\nNo ContributionCalendar found. First 500 chars:');
      console.log(d.substring(0, 500));
    }
  });
});
