(function () {
  const canvas = document.getElementById("snowfall-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let width, height, snowflakes;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createSnowflakes(count) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 3 + 1.5,
      fallSpeed: Math.random() * 1 + 0.5,
      drift: Math.random() * 1 - 0.5,
      swayAngle: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.01,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";

    for (const flake of snowflakes) {
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function update() {
    for (const flake of snowflakes) {
      flake.y += flake.fallSpeed;
      flake.swayAngle += flake.swaySpeed;
      flake.x += flake.drift + Math.sin(flake.swayAngle) * 0.6;

      if (flake.y > height) {
        flake.y = -flake.radius;
        flake.x = Math.random() * width;
      }
      if (flake.x > width) flake.x = 0;
      if (flake.x < 0) flake.x = width;
    }
  }

  function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
  }

  resize();
  snowflakes = createSnowflakes(120);
  window.addEventListener("resize", () => {
    resize();
  });

  if (prefersReducedMotion) {
    draw();
  } else {
    animate();
  }
})();
