var selectors = [];
selectors.push('.dropshadow');

$(selectors.join(',')).each(function() { PIE.attach(this); });