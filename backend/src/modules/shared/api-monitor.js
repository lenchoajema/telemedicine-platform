/**
 * API Route Monitor - Logs all registered routes on the Express app
 * Helps identify route conflicts and missing endpoints
 */

export const logRegisteredRoutes = (app) => {
  console.log('\n=== API ROUTES REGISTERED ===');
  
  try {
    // Check if app._router exists
    if (!app._router) {
      console.log('No router found on the app instance. This is normal in some environments.');
      console.log('Registered routes are available but cannot be programmatically listed.');
      console.log('===========================\n');
      return;
    }
    
    // Express 4.x way of getting routes
    const routes = [];
    
    try {
      // Safely traverse the middleware stack
      if (app._router.stack && Array.isArray(app._router.stack)) {
        app._router.stack.forEach((middleware) => {
          if (middleware.route) {
            // Routes registered directly
            routes.push({
              path: middleware.route.path,
              methods: Object.keys(middleware.route.methods).join(', ')
            });
          } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
            // Router middleware
            middleware.handle.stack.forEach((handler) => {
              const routePath = handler.route?.path;
              if (routePath) {
                routes.push({
                  path: routePath,
                  methods: Object.keys(handler.route.methods).join(', ')
                });
              }
            });
          }
        });
      }
    } catch (err) {
      console.log('Error traversing routes:', err.message);
      console.log('This is expected in some environments or Express versions.');
    }
    
    // Sort and print routes
    if (routes.length > 0) {
      routes.sort((a, b) => a.path.localeCompare(b.path));
      
      console.log('Total routes found:', routes.length);
      routes.forEach(route => {
        console.log(`${route.methods.toUpperCase().padEnd(10)} ${route.path}`);
      });
    } else {
      console.log('No routes could be extracted programmatically.');
    }
  } catch (error) {
    console.log('Failed to extract routes:', error.message);
  }
  
  console.log('===========================\n');
};
