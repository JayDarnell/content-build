// Medallia intercept survey for Teamsite pages on va.gov/ORMDI/*.*
(function(g) {
  var isStaging = window.location.host.includes('staging');
  if (!isStaging) return;

  var teamSitePathnames = [
    // `/ORMDI` redirects to include a trailing slash (`/ORMDI/`)
    // `/\/ormdi\/$/i.test('/ormdi/')` // true
    // `/\/ormdi\/$/i.test('/ORMDI/')` // true
    // `/\/ormdi\/$/i.test('/ORMDI/foo')` // false
    /\/ormdi\/$/i,
    /\/ormdi\/NoFEAR_Select.asp/i,
    /\/ormdi\/Contact_Us.asp/i,
    /\/ormdi\/EEOcomplaint.asp/i,
    /\/ormdi\/HPP.asp/i,
    /\/ormdi\/Diversity_Inclusion.asp/i,
    /\/ormdi\/Reasonable_Accommodations1.asp/i,
    // `/adr` redirects to include a trailing slash (`/adr/`)
    // `/\/adr\/$/i.test('/adr/')` // true
    // `/\/adr\/$/i.test('/ADR/')` // true
    // `/\/adr\/$/i.test('/ADR/foo')` // false
    /\/adr\/$/i,
  ];
  var pathname = window.location.pathname;
  var isApprovedPathname = teamSitePathnames.some(x => x.test(pathname));
  if (!isApprovedPathname) return;

  var d = document,
    am = d.createElement('script'),
    h = d.head || d.getElementsByTagName('head')[0],
    fsr = 'fsReady',
    aex = {
      src: 'https://resource.digital.voice.va.gov/wdcvoice/5/onsite/embed.js',
      type: 'text/javascript',
      async: 'true',
    };
  for (var attr in aex) {
    am.setAttribute(attr, aex[attr]);
  }
  h.appendChild(am);
  g[fsr] ||
    (g[fsr] = function() {
      var aT = '__' + fsr + '_stk__';
      g[aT] = g[aT] || [];
      g[aT].push(arguments);
    });
})(window);


(function () {
  if (window.KAMPYLE_ONSITE_SDK) {
      onsiteLoaded();
  } else {
      window.addEventListener('neb_OnsiteLoaded', onsiteLoaded);
  }
})()

function onsiteLoaded() {
  const surveyNumber = getSurveyNumber(window.location.pathname);
  var neb_status = KAMPYLE_ONSITE_SDK.loadForm(surveyNumber);
    if (neb_status === true) {
      console.log(`survey number ${surveyNumber} has loaded`)
  }
}

const vagovprodsurveys = {
    "/search": 21
}

function getSurveyNumber (url) {
    let pathUrl = trimSlash(url)
    return vagovprodsurveys[pathUrl] ? vagovprodsurveys[pathUrl] : 17;
}

function trimSlash(url) {
    return url.charAt(url.length - 1) === '/' ? url.slice(0, url.length - 1) : url;
}
