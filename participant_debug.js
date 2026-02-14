function debugParticipants() {
    const NAME_SELECTORS = [
        '[data-self-name]',
        '.zWGUib',
        '.adnwBd',
        '.YTbUzc',
        '.cS7aqe',
    ];

    console.log('--- DEFAULT SELF NAME DETECTION ---');
    const selfEl = document.querySelector('[data-self-name]');
    console.log('Self Element:', selfEl);
    console.log('Self Name (attr):', selfEl ? selfEl.getAttribute('data-self-name') : 'null');

    const profileBtn = document.querySelector('[aria-label*="conta"]') || document.querySelector('[aria-label*="account"]');
    console.log('Profile Button:', profileBtn);
    console.log('Profile Label:', profileBtn ? profileBtn.getAttribute('aria-label') : 'null');

    console.log('--- PARTICIPANT LIST DETECTION ---');
    const foundNames = new Set();
    NAME_SELECTORS.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            console.log(`Match [${sel}]:`, el.innerText || el.textContent);
            foundNames.add(el.innerText || el.textContent);
        });
    });

    console.log('--- ALL FOUND NAMES ---');
    console.log([...foundNames]);
}
debugParticipants();
