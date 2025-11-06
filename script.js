(function() {
  'use strict';

  if (!window.__app) {
    window.__app = {};
  }

  var app = window.__app;

  if (app.initialized) {
    return;
  }

  var selectors = {
    header: '.l-header',
    logo: '.c-logo',
    logoImg: '.c-logo__img',
    nav: '.c-nav#main-nav',
    navToggle: '.c-nav__toggle',
    navList: '.c-nav__list',
    navLink: '.c-nav__link'
  };

  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  function throttle(func, limit) {
    var inThrottle;
    return function() {
      var args = arguments;
      var context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function() {
          inThrottle = false;
        }, limit);
      }
    };
  }

  function initAOS() {
    if (app.aosInitialized) return;
    app.aosInitialized = true;

    if (typeof AOS !== 'undefined') {
      var avoidLayoutElements = document.querySelectorAll('[data-aos][data-avoid-layout="true"]');
      for (var i = 0; i < avoidLayoutElements.length; i++) {
        avoidLayoutElements[i].removeAttribute('data-aos');
      }

      AOS.init({
        once: false,
        duration: 800,
        easing: 'ease-out-cubic',
        offset: 120,
        mirror: false,
        disable: function() {
          return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
      });

      app.refreshAOS = function() {
        try {
          if (typeof AOS !== 'undefined' && AOS.refresh) {
            AOS.refresh();
          }
        } catch (e) {}
      };
    } else {
      app.refreshAOS = function() {};
    }
  }

  function initBurgerMenu() {
    if (app.burgerInitialized) return;
    app.burgerInitialized = true;

    var nav = document.querySelector(selectors.nav);
    var toggle = document.querySelector(selectors.navToggle);
    var navList = document.querySelector(selectors.navList);
    var navLinks = document.querySelectorAll(selectors.navLink);

    if (!nav || !toggle) return;

    var focusableElements = [];
    var firstFocusable = null;
    var lastFocusable = null;

    function updateFocusableElements() {
      if (!navList) return;
      focusableElements = Array.prototype.slice.call(
        navList.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])')
      );
      firstFocusable = focusableElements[0];
      lastFocusable = focusableElements[focusableElements.length - 1];
    }

    function openMenu() {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('u-no-scroll');
      updateFocusableElements();
      if (firstFocusable) {
        setTimeout(function() {
          firstFocusable.focus();
        }, 100);
      }
    }

    function closeMenu() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('u-no-scroll');
    }

    function toggleMenu() {
      if (nav.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      toggleMenu();
    });

    document.addEventListener('keydown', function(e) {
      if (!nav.classList.contains('is-open')) return;

      if (e.key === 'Escape' || e.key === 'Esc') {
        closeMenu();
        toggle.focus();
      }

      if (e.key === 'Tab') {
        if (focusableElements.length === 0) return;

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    });

    document.addEventListener('click', function(e) {
      if (!nav.classList.contains('is-open')) return;
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', function() {
        closeMenu();
      });
    }

    var resizeHandler = debounce(function() {
      if (window.innerWidth >= 1024) {
        closeMenu();
      }
    }, 250);

    window.addEventListener('resize', resizeHandler, { passive: true });
  }

  function initAnchorsAndSmooth() {
    if (app.anchorsInitialized) return;
    app.anchorsInitialized = true;

    var currentPath = window.location.pathname;
    var isHomepage = currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/index.html');

    var links = document.querySelectorAll('a[href]');

    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var href = link.getAttribute('href');

      if (!href || href === '#' || href === '#!') continue;

      if (href.startsWith('#')) {
        if (!isHomepage) {
          var sectionId = href.substring(1);
          if (document.getElementById(sectionId)) {
            continue;
          }
          link.setAttribute('href', '/' + href);
        }

        link.addEventListener('click', function(e) {
          var targetHref = this.getAttribute('href');
          if (!targetHref || targetHref === '#' || targetHref === '#!') return;

          var hashIndex = targetHref.indexOf('#');
          if (hashIndex === -1) return;

          var hash = targetHref.substring(hashIndex + 1);
          var targetElement = document.getElementById(hash);

          if (targetElement) {
            e.preventDefault();

            var header = document.querySelector(selectors.header);
            var offset = header ? header.offsetHeight : 80;

            var elementPosition = targetElement.getBoundingClientRect().top;
            var offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });

            if (window.history && window.history.pushState) {
              window.history.pushState(null, null, '#' + hash);
            }
          }
        });
      }
    }
  }

  function initActiveMenu() {
    if (app.activeMenuInitialized) return;
    app.activeMenuInitialized = true;

    var currentPath = window.location.pathname;
    var navLinks = document.querySelectorAll(selectors.navLink);

    for (var i = 0; i < navLinks.length; i++) {
      var link = navLinks[i];
      var linkPath = link.getAttribute('href');

      if (!linkPath) continue;

      var isActive = false;

      if (linkPath === '/' || linkPath === '/index.html' || linkPath === 'index.html') {
        if (currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/index.html')) {
          isActive = true;
        }
      } else if (linkPath.startsWith('/')) {
        if (currentPath === linkPath || currentPath.endsWith(linkPath)) {
          isActive = true;
        }
      } else {
        if (currentPath.endsWith('/' + linkPath)) {
          isActive = true;
        }
      }

      if (isActive) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('is-active');
      }
    }
  }

  function initImages() {
    if (app.imagesInitialized) return;
    app.imagesInitialized = true;

    var images = document.querySelectorAll('img');

    for (var i = 0; i < images.length; i++) {
      var img = images[i];

      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }

      var hasLoading = img.hasAttribute('loading');
      var isCritical = img.hasAttribute('data-critical');
      var isLogo = img.classList.contains('c-logo__img');

      if (!hasLoading && !isCritical && !isLogo) {
        img.setAttribute('loading', 'lazy');
      }

      img.style.opacity = '0';
      img.style.transform = 'translateY(20px)';
      img.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';

      if (img.complete) {
        setTimeout(function(image) {
          return function() {
            image.style.opacity = '1';
            image.style.transform = 'translateY(0)';
          };
        }(img), 100 * i);
      } else {
        img.addEventListener('load', function() {
          this.style.opacity = '1';
          this.style.transform = 'translateY(0)';
        });
      }

      img.addEventListener('error', function() {
        if (this.dataset.fallbackApplied) return;
        this.dataset.fallbackApplied = 'true';

        var placeholderSVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23999"%3EImage not available%3C/text%3E%3C/svg%3E';
        this.src = placeholderSVG;
        this.style.objectFit = 'contain';

        if (this.classList.contains('c-logo__img')) {
          this.style.maxHeight = '40px';
        }
      });
    }
  }

  function initForms() {
    if (app.formsInitialized) return;
    app.formsInitialized = true;

    var forms = document.querySelectorAll('.needs-validation');

    app.notify = function(message, type) {
      var container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.maxWidth = '350px';
        document.body.appendChild(container);
      }

      var alertClass = 'alert-info';
      if (type === 'success') alertClass = 'alert-success';
      if (type === 'error' || type === 'danger') alertClass = 'alert-danger';
      if (type === 'warning') alertClass = 'alert-warning';

      var alert = document.createElement('div');
      alert.className = 'alert ' + alertClass + ' alert-dismissible fade show';
      alert.setAttribute('role', 'alert');
      alert.style.animation = 'slideInRight 0.3s ease-out';
      alert.innerHTML = message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';

      container.appendChild(alert);

      setTimeout(function() {
        alert.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(function() {
          if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
          }
        }, 300);
      }, 5000);
    };

    function validateEmail(email) {
      var re = /^[^s@]+@[^s@]+.[^s@]+$/;
      return re.test(String(email).toLowerCase());
    }

    function validatePhone(phone) {
      var cleaned = phone.replace(/D/g, '');
      return cleaned.length >= 10;
    }

    function validateName(name) {
      var re = /^[a-zA-ZäöüßÄÖÜs-']+$/;
      return name.length >= 2 && re.test(name);
    }

    function showError(field, message) {
      field.classList.add('is-invalid');
      field.classList.remove('is-valid');
      
      var feedback = field.nextElementSibling;
      if (!feedback || !feedback.classList.contains('invalid-feedback')) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        field.parentNode.insertBefore(feedback, field.nextSibling);
      }
      feedback.textContent = message;
      feedback.style.display = 'block';
      
      field.style.animation = 'shake 0.3s ease-in-out';
      setTimeout(function() {
        field.style.animation = '';
      }, 300);
    }

    function clearError(field) {
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
      
      var feedback = field.nextElementSibling;
      if (feedback && feedback.classList.contains('invalid-feedback')) {
        feedback.style.display = 'none';
      }
    }

    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      
      var inputs = form.querySelectorAll('input, textarea, select');
      for (var j = 0; j < inputs.length; j++) {
        inputs[j].addEventListener('blur', function() {
          validateField(this);
        });
        
        inputs[j].addEventListener('input', function() {
          if (this.classList.contains('is-invalid')) {
            validateField(this);
          }
        });
      }

      form.addEventListener('submit', function(event) {
        event.preventDefault();
        event.stopPropagation();

        var isValid = true;
        var firstInvalidField = null;

        var nameField = this.querySelector('input[name="name"]');
        if (nameField) {
          if (!nameField.value.trim()) {
            showError(nameField, 'Bitte geben Sie Ihren Namen ein.');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = nameField;
          } else if (!validateName(nameField.value.trim())) {
            showError(nameField, 'Bitte geben Sie einen gültigen Namen ein (nur Buchstaben).');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = nameField;
          } else {
            clearError(nameField);
          }
        }

        var emailField = this.querySelector('input[name="email"]');
        if (emailField) {
          if (!emailField.value.trim()) {
            showError(emailField, 'Bitte geben Sie Ihre E-Mail-Adresse ein.');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = emailField;
          } else if (!validateEmail(emailField.value.trim())) {
            showError(emailField, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = emailField;
          } else {
            clearError(emailField);
          }
        }

        var phoneField = this.querySelector('input[name="phone"]');
        if (phoneField) {
          if (!phoneField.value.trim()) {
            showError(phoneField, 'Bitte geben Sie Ihre Telefonnummer ein.');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = phoneField;
          } else if (!validatePhone(phoneField.value.trim())) {
            showError(phoneField, 'Bitte geben Sie eine gültige Telefonnummer ein (mindestens 10 Ziffern).');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = phoneField;
          } else {
            clearError(phoneField);
          }
        }

        var messageField = this.querySelector('textarea[name="message"]');
        if (messageField && messageField.hasAttribute('required')) {
          if (!messageField.value.trim()) {
            showError(messageField, 'Bitte geben Sie Ihre Nachricht ein.');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = messageField;
          } else if (messageField.value.trim().length < 10) {
            showError(messageField, 'Ihre Nachricht muss mindestens 10 Zeichen lang sein.');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = messageField;
          } else {
            clearError(messageField);
          }
        }

        var privacyCheckbox = this.querySelector('input[name="privacy_policy"]');
        if (privacyCheckbox) {
          if (!privacyCheckbox.checked) {
            showError(privacyCheckbox, 'Bitte akzeptieren Sie die Datenschutzerklärung.');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = privacyCheckbox;
          } else {
            clearError(privacyCheckbox);
          }
        }

        if (!isValid) {
          this.classList.add('was-validated');
          if (firstInvalidField) {
            firstInvalidField.focus();
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }

        this.classList.add('was-validated');

        var submitButton = this.querySelector('button[type="submit"]');
        var originalText = '';

        if (submitButton) {
          submitButton.disabled = true;
          originalText = submitButton.innerHTML;
          submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Wird gesendet...';
          submitButton.style.opacity = '0.7';
        }

        var formData = new FormData(this);
        var data = {};
        formData.forEach(function(value, key) {
          data[key] = value;
        });

        var formElement = this;

        setTimeout(function() {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
            submitButton.style.opacity = '1';
          }

          app.notify('Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.', 'success');
          formElement.reset();
          formElement.classList.remove('was-validated');
          
          var allFields = formElement.querySelectorAll('input, textarea, select');
          for (var k = 0; k < allFields.length; k++) {
            allFields[k].classList.remove('is-valid', 'is-invalid');
          }

          setTimeout(function() {
            window.location.href = 'thank_you.html';
          }, 1000);
        }, 1500);
      });
    }

    function validateField(field) {
      var name = field.getAttribute('name');
      var value = field.value.trim();

      if (name === 'name') {
        if (!value) {
          showError(field, 'Bitte geben Sie Ihren Namen ein.');
        } else if (!validateName(value)) {
          showError(field, 'Bitte geben Sie einen gültigen Namen ein (nur Buchstaben).');
        } else {
          clearError(field);
        }
      } else if (name === 'email') {
        if (!value) {
          showError(field, 'Bitte geben Sie Ihre E-Mail-Adresse ein.');
        } else if (!validateEmail(value)) {
          showError(field, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
        } else {
          clearError(field);
        }
      } else if (name === 'phone') {
        if (!value) {
          showError(field, 'Bitte geben Sie Ihre Telefonnummer ein.');
        } else if (!validatePhone(value)) {
          showError(field, 'Bitte geben Sie eine gültige Telefonnummer ein (mindestens 10 Ziffern).');
        } else {
          clearError(field);
        }
      } else if (name === 'message' && field.hasAttribute('required')) {
        if (!value) {
          showError(field, 'Bitte geben Sie Ihre Nachricht ein.');
        } else if (value.length < 10) {
          showError(field, 'Ihre Nachricht muss mindestens 10 Zeichen lang sein.');
        } else {
          clearError(field);
        }
      } else if (name === 'privacy_policy') {
        if (!field.checked) {
          showError(field, 'Bitte akzeptieren Sie die Datenschutzerklärung.');
        } else {
          clearError(field);
        }
      }
    }
  }

  function initButtonAnimations() {
    if (app.buttonAnimationsInitialized) return;
    app.buttonAnimationsInitialized = true;

    var buttons = document.querySelectorAll('.c-button, .btn, .c-card__link, .c-blog-card__link');

    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i];
      
      button.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      });

      button.addEventListener('mouseleave', function() {
        this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      });
    }
  }

  function initCardAnimations() {
    if (app.cardAnimationsInitialized) return;
    app.cardAnimationsInitialized = true;

    var cards = document.querySelectorAll('.c-card, .card, .c-pricing-card, .c-testimonial, .c-offer-card, .c-blog-card, .c-feature, .c-team-card');

    var observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(30px)';
          
          setTimeout(function() {
            entry.target.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 100);
          
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    for (var i = 0; i < cards.length; i++) {
      observer.observe(cards[i]);
    }
  }

  function initSectionAnimations() {
    if (app.sectionAnimationsInitialized) return;
    app.sectionAnimationsInitialized = true;

    var sections = document.querySelectorAll('.c-section, .l-section');

    var observerOptions = {
      threshold: 0.05,
      rootMargin: '0px'
    };

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(20px)';
          
          setTimeout(function() {
            entry.target.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 150);
          
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    for (var i = 0; i < sections.length; i++) {
      observer.observe(sections[i]);
    }
  }

  function initHeaderAnimation() {
    if (app.headerAnimationInitialized) return;
    app.headerAnimationInitialized = true;

    var header = document.querySelector('.l-header');
    if (!header) return;

    var lastScrollTop = 0;
    var scrollThreshold = 100;

    var scrollHandler = throttle(function() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > scrollThreshold) {
        header.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
      } else {
        header.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
        header.style.backgroundColor = 'white';
      }

      lastScrollTop = scrollTop;
    }, 100);

    window.addEventListener('scroll', scrollHandler, { passive: true });
    header.style.transition = 'box-shadow 0.3s ease, background-color 0.3s ease';
  }

  function initAnimeInteractions() {
    if (app.animeInitialized) return;
    app.animeInitialized = true;

    if (typeof anime === 'undefined') return;

    var selectors = ['.card', '.feature-card', '.animal-card', '.btn-primary', '.btn-success'];
    var elements = document.querySelectorAll(selectors.join(', '));

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];

      el.addEventListener('mouseenter', function() {
        anime({
          targets: this,
          scale: 1.03,
          duration: 300,
          easing: 'easeOutQuad'
        });
      });

      el.addEventListener('mouseleave', function() {
        anime({
          targets: this,
          scale: 1,
          duration: 300,
          easing: 'easeOutQuad'
        });
      });
    }
  }

  function initMobileFlexGaps() {
    if (app.mobileGapsInitialized) return;
    app.mobileGapsInitialized = true;

    function applyMobileGaps() {
      var isMobile = window.innerWidth < 576;
      var flexElements = document.querySelectorAll('.d-flex');

      for (var i = 0; i < flexElements.length; i++) {
        var el = flexElements[i];
        var hasGap = false;

        var classList = el.className.split(' ');
        for (var j = 0; j < classList.length; j++) {
          if (classList[j].startsWith('gap-') || classList[j].startsWith('g-')) {
            hasGap = true;
            break;
          }
        }

        var childCount = 0;
        for (var k = 0; k < el.children.length; k++) {
          if (el.children[k].nodeType === 1) {
            childCount++;
          }
        }

        if (isMobile && !hasGap && childCount > 1) {
          el.classList.add('gap-3');
          el.dataset.gapAdded = 'true';
        } else if (!isMobile && el.dataset.gapAdded === 'true') {
          el.classList.remove('gap-3');
          el.dataset.gapAdded = 'false';
        }
      }
    }

    applyMobileGaps();

    var resizeHandler = debounce(function() {
      applyMobileGaps();
    }, 250);

    window.addEventListener('resize', resizeHandler, { passive: true });
  }

  function initParallaxEffects() {
    if (app.parallaxInitialized) return;
    app.parallaxInitialized = true;

    var heroSections = document.querySelectorAll('.c-hero, .l-section--hero');

    var scrollHandler = throttle(function() {
      var scrolled = window.pageYOffset;

      for (var i = 0; i < heroSections.length; i++) {
        var hero = heroSections[i];
        var rect = hero.getBoundingClientRect();
        
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          var offset = scrolled * 0.5;
          hero.style.transform = 'translateY(' + offset + 'px)';
        }
      }
    }, 16);

    window.addEventListener('scroll', scrollHandler, { passive: true });
  }

  app.init = function() {
    initAOS();
    initBurgerMenu();
    initAnchorsAndSmooth();
    initActiveMenu();
    initImages();
    initForms();
    initButtonAnimations();
    initCardAnimations();
    initSectionAnimations();
    initHeaderAnimation();
    initAnimeInteractions();
    initMobileFlexGaps();
    initParallaxEffects();

    app.initialized = true;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }

})();
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert {
  padding: 1rem 1.5rem;
  border-radius: var(--border-radius-md);
  margin-bottom: 1rem;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.alert-success {
  background-color: #d1fae5;
  border-color: #6ee7b7;
  color: #065f46;
}

.alert-danger {
  background-color: #fee2e2;
  border-color: #fca5a5;
  color: #991b1b;
}

.alert-warning {
  background-color: #fef3c7;
  border-color: #fcd34d;
  color: #92400e;
}

.alert-info {
  background-color: #dbeafe;
  border-color: #93c5fd;
  color: #1e40af;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  opacity: 1;
}

.btn-close::before {
  content: '×';
  font-weight: bold;
}

.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}

.spinner-border-sm {
  width: 0.875rem;
  height: 0.875rem;
  border-width: 0.15em;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

.fade {
  transition: opacity 0.15s linear;
}

.fade:not(.show) {
  opacity: 0;
}

.show {
  opacity: 1;
}
