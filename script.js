document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('js');

  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  const quoteForm = document.getElementById('quoteForm');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const isOpen = navLinks.classList.contains('open');
      menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        menuToggle.setAttribute('aria-label', 'Open navigation');
      });
    });
  }

  if (quoteForm) {
    quoteForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const inputs = quoteForm.querySelectorAll('input');
      const select = quoteForm.querySelector('select');
      const textarea = quoteForm.querySelector('textarea');

      const name = inputs[0]?.value || '';
      const email = inputs[1]?.value || '';
      const recipient = select?.value || 'angelique@procouriers.co.za';
      const details = textarea?.value || '';

      const subject = encodeURIComponent('Courier quote request');
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\nPickup & delivery details:\n${details}`
      );

      window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    });
  }

  const revealItems = document.querySelectorAll('.reveal');
  if (revealItems.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    revealItems.forEach((item) => observer.observe(item));
  }

  const overnightRates = {
    major_ct: { first2: 140, perKg: 72 },
    major_pe: { first2: 140, perKg: 72 },
    major_el: { first2: 140, perKg: 72 },
    major_other: { first2: 140, perKg: 60 },
    regional_ct: { first2: 240, perKg: 72 },
    regional_pe: { first2: 240, perKg: 72 },
    regional_el: { first2: 240, perKg: 72 },
    regional_other: { first2: 240, perKg: 72 }
  };

  const roadRates = {
    local: { minRate: 140, perKg: 4 },
    durban: { minRate: 140, perKg: 6.5 },
    cape_town: { minRate: 140, perKg: 8.7 },
    port_elizabeth: { minRate: 140, perKg: 9.5 },
    east_london: { minRate: 140, perKg: 9.5 },
    bloemfontein: { minRate: 140, perKg: 9.5 },
    george: { minRate: 140, perKg: 13.5 },
    outlying: { minRate: 254, perKg: 13.5 }
  };

  const svcType = document.getElementById('svcType');
  const svcWeight = document.getElementById('svcWeight');
  const svcVolWeight = document.getElementById('svcVolWeight');
  const priceResult = document.getElementById('priceResult');
  const areaHint = document.getElementById('areaHint');
  const originInput = document.getElementById('originTown');
  const destInput = document.getElementById('destTown');

  const docFeeAmount = 10;

  const regionalOverrides = new Set([
    'somerset west',
    'somerset-wes'
  ]);

  let autoArea = { overnight: 'regional_other', road: 'outlying' };

  function calcVol() {
    const len = parseFloat(document.getElementById('volLength')?.value || '0');
    const wid = parseFloat(document.getElementById('volWidth')?.value || '0');
    const hei = parseFloat(document.getElementById('volHeight')?.value || '0');
    const div = parseFloat(document.getElementById('volDivisor')?.value || '5000');
    const raw = div > 0 ? (len * wid * hei) / div : 0;
    const vol = Math.ceil(raw);
    const out = document.getElementById('volResult');
    if (out) out.textContent = isFinite(vol) && vol > 0 ? String(vol) : '0';
  }

  function calcPrice() {
    if (!svcType || !priceResult) return;
    const type = svcType.value;
    const actual = parseFloat(svcWeight?.value || '0') || 0;
    const vol = parseFloat(svcVolWeight?.value || '0') || 0;
    const chargeable = Math.max(actual, vol, 0);

    if (chargeable <= 0) {
      priceResult.textContent = 'R0.00';
      return;
    }

    let total = 0;

    if (type === 'overnight') {
      const rate = overnightRates[autoArea.overnight];
      if (rate) {
        total = chargeable <= 2 ? rate.first2 : rate.first2 + (chargeable - 2) * rate.perKg;
      }
    } else if (type === 'road') {
      const rate = roadRates[autoArea.road];
      if (rate) {
        total = chargeable <= 10 ? rate.minRate : rate.minRate + (chargeable - 10) * rate.perKg;
        total = total * 1.32;
      }
    }

    total += docFeeAmount;

    priceResult.textContent = `R${total.toFixed(2)}`;
  }

  const townData = window.TOWN_DATA || null;

  function isMajorTown(name) {
    if (!townData || !name) return false;
    const key = name.trim().toLowerCase();
    if (regionalOverrides.has(key)) return false;
    const data = townData[key];
    return data && data.category === 'major';
  }

  function updateAutoArea() {
    const originMajor = isMajorTown(originInput?.value || '');
    const destMajor = isMajorTown(destInput?.value || '');

    const bothMajor = originMajor && destMajor;
    autoArea.overnight = bothMajor ? 'major_other' : 'regional_other';

    const destTown = destInput?.value.trim().toLowerCase() || '';
    if (destTown.includes('durban')) autoArea.road = 'durban';
    else if (destTown.includes('cape town')) autoArea.road = 'cape_town';
    else if (destTown.includes('port elizabeth') || destTown.includes('gqeberha')) autoArea.road = 'port_elizabeth';
    else if (destTown.includes('east london')) autoArea.road = 'east_london';
    else if (destTown.includes('bloemfontein')) autoArea.road = 'bloemfontein';
    else if (destTown.includes('george')) autoArea.road = 'george';
    else autoArea.road = bothMajor ? 'local' : 'outlying';

    if (areaHint) {
      areaHint.textContent = bothMajor
        ? 'Origin and destination are within 50 km of major airports.'
        : 'Either origin or destination is more than 50 km from a major airport.';
    }

    calcPrice();
  }

  if (originInput && destInput) {
    originInput.addEventListener('input', updateAutoArea);
    destInput.addEventListener('input', updateAutoArea);
  }

  ['volLength','volWidth','volHeight','volDivisor'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', calcVol);
      el.addEventListener('change', calcVol);
    }
  });

  [svcType, svcWeight, svcVolWeight].forEach((el) => {
    if (el) {
      el.addEventListener('input', calcPrice);
      el.addEventListener('change', calcPrice);
    }
  });

  calcVol();
  calcPrice();
});
