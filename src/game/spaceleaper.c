#include <assert.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "./spaceleaper.h"

#ifdef EMSCRIPTEN
#include <SDL/SDL.h>
#else
#include <SDL/SDL_keysym.h>
#endif

#include "src/game/opengl.h"
#include "src/obj/index.h"
#include "src/pphys/index.h"
#include "src/input/index.h"
#include "src/audio/audio.h"

#include "src/audio/audio_dummy.h"
#ifdef AUDIO_OPENAL
#include "src/audio/audio_openal.h"
#endif
#ifdef AUDIO_WEBAUDIO
#include "src/audio/audio_webaudio.h"
#endif

#include "src/game/flowline.h"
#include "src/game/asteroid.h"
#include "src/game/camera.h"
#include "src/game/renderer.h"
#include "src/game/shaders.h"
#include "src/game/loop.h"
#include "src/game/leaper.h"
#include "src/game/cameracontroller.h"
#include "src/game/asteroidview.h"
#include "src/game/particleview.h"
#include "src/game/ambientparticle.h"

#define kFrameFraction 1.0 / 20
#ifndef kParticleCount
#define kParticleCount 2048
#endif
#ifndef kParticleBaseSize
#define kParticleBaseSize 3
#endif
#ifndef kParticleSizeRange
#define kParticleSizeRange 1
#endif 

static const int particle_count = kParticleCount;
static AQWorld *world;
// static AQFlowLine *flowLine;
static aqvec2 gravity;

static AQList *asteroids;
static SLLeaper *leaper;
static SLCameraController *cameraController;

GLuint buffer;

aqbool paused;

void (*endCallback)() = NULL;
void (*visitedCallback)( unsigned int ) = NULL;
void (*resourceCallback)( unsigned int ) = NULL;

void collision_noop( void *a, void *b, void *col ) {}

void initWaterTest() {
  AQReleasePool *pool = aqinit( aqalloc( &AQReleasePoolType ));

  AQLoop_boot();
  AQRenderer_boot();

  #ifdef AUDIO_OPENAL
  AQAudioDriver_setContext( (AQObj*) AQOpenALDriver_create() );
  #else
  #ifdef AUDIO_WEBAUDIO
  AQAudioDriver_setContext( (AQObj*) AQWebAudioDriver_create() );
  #else
  AQAudioDriver_setContext( (AQObj*) AQDummyDriver_create() );
  #endif
  #endif

  AQAudioDriver_setMasterVolume( 1 );

  // Preload sounds.
  AQSound_load( aqstr( "asteroidhit.wav" ));
  AQSound_load( aqstr( "jump.wav" ));
  AQSound_load( aqstr( "resourcegain.wav" ));
  AQSound_load( aqstr( "oxygengain.wav" ));

  int space = 25600;
  int n = 64;
  int ambients = 0;
  int ambientN = 9;

  #if EMSCRIPTEN
  space = 12800;
  n = 32;
  ambientN = 9;
  #endif

  AQDOUBLE blockSize = (AQDOUBLE) space / n;
  AQDOUBLE ambientSize = (AQDOUBLE) space / n / ambientN;

  world = AQLoop_world();
  AQWorld_setAabb( world, (aqaabb) { space, space, 0, 0 });
  AQInput_setWorldFrame( space, space, 0, 0 );

  asteroids = aqinit( aqalloc( &AQListType ));

  SLAsteroid *homeAsteroid = NULL;

  SLAsteroidGroupView *asteroidView = SLAsteroidGroupView_create();

  for ( int i = 0; i < n; ++i ) {
    for ( int j = 0; j < n; ++j ) {
      float asteroidRadius = ((double) rand() ) / RAND_MAX * world->aabb.right / n / 8 + world->aabb.right / n / 8;
      SLAsteroid *asteroid = SLAsteroid_create(
        world,
        aqvec2_make(
          rand() % (int) ( world->aabb.right / n - asteroidRadius * 2 ) + world->aabb.right / n * i + asteroidRadius,
          rand() % (int) ( world->aabb.top / n - asteroidRadius * 2 ) + world->aabb.top / n * j + asteroidRadius
        ),
        asteroidRadius
      );
      AQList_push( asteroids, (AQObj *) asteroid );
      SLAsteroidGroupView_addAsteroid( asteroidView, asteroid );

      for ( int k = 0; k < ambientN * ambientN; k++ ) {
        aqvec2 position = aqvec2_make(
          blockSize * i + ambientSize * ( k % ambientN ) + rand() % (int) ( ambientSize - ambientSize * 0.5 ) + ambientSize * 0.25,
          blockSize * j + ambientSize * floor( k / ambientN ) + rand() % (int) ( ambientSize - ambientSize * 0.5 ) + ambientSize * 0.25
        );
        // aqvec2 position = aqvec2_make(
        //   rand() % (int) ( world->aabb.right / n ) + world->aabb.right / n * i,
        //   rand() % (int) ( world->aabb.top / n ) + world->aabb.top / n * j
        // );

        if ( !aqaabb_intersectsCircle( aqaabb_makeCenterRadius( position, 20 ), asteroid->center, asteroid->radius )) {
          ambients++;
          AQParticle *ambientParticle = aqcreate( &AQParticleType );
          ambientParticle->position = ambientParticle->lastPosition = position;
          ambientParticle->radius = ambientSize * 0.25;
          // ambientParticle->isTrigger = 1;
          ambientParticle->friction = 1;
          ambientParticle->mass = 0.01;
          SLAmbientParticle *ambientData = aqcreate( &SLAmbientParticleType );
          SLAmbientParticle_setParticle( ambientData, ambientParticle );
          ambientParticle->userdata = aqretain( ambientData );
          ambientParticle->oncollision = collision_noop;
          AQWorld_addParticle( world, ambientParticle );

          // if ( k == 0 ) {
            // SLParticleView_addAmbientParticle( ambientParticle );
          // }
        }
      }

      if (
        i < n / 8 * 5 && i > n / 8 * 3 &&
          j < n / 8 * 5 && j > n / 8 * 3
      ) {
        if ( !homeAsteroid ) {
          homeAsteroid = asteroid;
        } else if ( rand() < RAND_MAX / 100 ) {
          homeAsteroid = asteroid;
        }
      }
    }
  }

  printf( "%d Ambients.\n", ambients );

  assert( homeAsteroid );
  SLAsteroid_setIsHome( homeAsteroid, 1 );
  homeAsteroid->isVisible = 1;

  void *particleView = SLParticleView_getAmbientParticleView();
  SLParticleView_setHomeAsteroid( particleView, homeAsteroid );

  AQRenderer_addView( particleView );
  AQLoop_addUpdater( particleView );

  AQRenderer_addView( asteroidView );
  AQRenderer_addView( leaper = SLLeaper_create(
    aqvec2_add(
      homeAsteroid->center,
      aqvec2_make( 5, 5 )
    )
  ));
  leaper->radians = M_PI / 4;
  leaper->onvisit = visitedCallback;
  leaper->onresource = resourceCallback;

  SLParticleView_setLeaper( particleView, leaper );

  AQLoop_addUpdater(
    cameraController =
      SLCameraController_setHome(
        SLCameraController_setLeaper(
          SLCameraController_create(),
          leaper
        ),
        homeAsteroid
      )
  );

  cameraController->minScale = 4;
  cameraController->floatingScale = 20;

  // Init input actions.
  AQInputAction *leftAction = AQInputAction_create( aqstr( "rotate-left" ));
  AQInputAction *rightAction = AQInputAction_create( aqstr( "rotate-right" ));
  AQInputAction *jumpAction = AQInputAction_create( aqstr( "jump" ));
  AQInputAction *zoomAction = AQInputAction_create( aqstr( "zoom" ));

  AQInput_setActionToKeys( leftAction, SDLK_a, SDLK_j, SDLK_z, SDLK_LEFT, 0 );
  AQInput_setActionToKeys( rightAction, SDLK_d, SDLK_l, SDLK_x, SDLK_RIGHT, 0 );
  AQInput_setActionToKeys( jumpAction, SDLK_w, SDLK_i, SDLK_SPACE, SDLK_UP, 0 );
  AQInput_setActionToKeys( zoomAction, SDLK_s, SDLK_k, SDLK_LSHIFT, SDLK_DOWN, 0 );

  glGenBuffers(1, &buffer);

  aqfree( pool );
}

// struct glcolor {
//   GLubyte r,g,b,a;
// };

struct glvertex {
  GLfloat vertex[2];
  struct glcolor color;
};

struct glparticle {
  struct glvertex vertices[6];
};

struct gldata {
  int index;
  struct glparticle particles[kParticleCount+1024];
};

static void set_particle_vertices( AQParticle *particle, void *ctx ) {
    struct gldata *data = ctx;
    struct glcolor color = { 255, 255, 255, 128 };

    // if ( particle->isSleeping ) {
    //   color = (struct glcolor) { 0, 255, 0, 128 };
    // }
    // color.a *= fmax( fmin( aqvec2_mag2( aqvec2_sub( particle->position, particle->oldPosition )), 1.0 ), 0.2 );
    // if ( particle->mass > 100 ) {
    //   color = (struct glcolor) { 255, 0, 0, 128 };
    // }
    // if ( particle->mass < 10 ) {
    //   color = (struct glcolor) { 0, 0, 255, 128 };
    // }
    if ( particle->isStatic ) {
      color = (struct glcolor) { 0, 0, 255, 128 };
    }
    if ( AQParticle_isHomeAsteroid( particle )) {
      color = (struct glcolor) { 0, 255, 0, 128 };
    }
    if ( particle->userdata ) {
      return;
    }

    aqaabb particlebox = AQParticle_aabb( particle );
    data->particles[data->index].vertices[0].vertex[0] = particlebox.left;
    data->particles[data->index].vertices[0].vertex[1] = particlebox.top;
    data->particles[data->index].vertices[0].color = color;

    data->particles[data->index].vertices[1].vertex[0] = particlebox.right;
    data->particles[data->index].vertices[1].vertex[1] = particlebox.top;
    data->particles[data->index].vertices[1].color = color;

    data->particles[data->index].vertices[2].vertex[0] = particlebox.right;
    data->particles[data->index].vertices[2].vertex[1] = particlebox.bottom;
    data->particles[data->index].vertices[2].color = color;

    data->particles[data->index].vertices[3].vertex[0] = particlebox.left;
    data->particles[data->index].vertices[3].vertex[1] = particlebox.top;
    data->particles[data->index].vertices[3].color = color;

    data->particles[data->index].vertices[4].vertex[0] = particlebox.left;
    data->particles[data->index].vertices[4].vertex[1] = particlebox.bottom;
    data->particles[data->index].vertices[4].color = color;

    data->particles[data->index].vertices[5].vertex[0] = particlebox.right;
    data->particles[data->index].vertices[5].vertex[1] = particlebox.bottom;
    data->particles[data->index].vertices[5].color = color;
    data->index++;
}

void setWaterTestGravity(float _gravity[3]) {
    gravity.x = _gravity[1] * 32;
    gravity.y = -_gravity[0] * 32;
//    printf("%f %f %f\n", gravity[0], gravity[1], gravity[2]);
}

void gravityIterator( AQParticle *particle, void *ctx ) {
  particle->acceleration = aqvec2_add( particle->acceleration, gravity );
}

unsigned int (*getTicks)() = NULL;
void setGetTicksFunction( unsigned int (*_getTicks)() ) {
  getTicks = _getTicks;
}

#define INT_MAX 0x7fffffff

unsigned int minTime( unsigned int frameTimes[], unsigned int length ) {
  unsigned int min = INT_MAX;
  int i = 0;
  for ( ; i < length; ++i ) {
    int frame = frameTimes[ i ];
    if ( frame < min ) {
      min = frame;
    }
  }
  return min;
}

unsigned int maxTime( unsigned int frameTimes[], unsigned int length ) {
  unsigned int max = 0;
  int i = 0;
  for ( ; i < length; ++i ) {
    int frame = frameTimes[ i ];
    if ( frame > max ) {
      max = frame;
    }
  }
  return max;
}

unsigned int avgTime( unsigned int frameTimes[], unsigned int length ) {
  unsigned int sum = 0;
  int i = 0;
  for ( ; i < length; ++i ) {
    sum += frameTimes[ i ];
  }
  return sum / length;
}

float stddevTime( unsigned int frameTimes[], unsigned int length ) {
  unsigned int avg = avgTime( frameTimes, length );
  unsigned int diffSum = 0;
  int i = 0;
  for ( ; i < length; ++i ) {
    int diff = frameTimes[ i ] - avg;
    diffSum += diff * diff;
  }
  return sqrt( diffSum / (float) length );
}

void stepInputWaterTest() {
  if ( paused ) return;

  float screenWidth, screenHeight;
  AQInput_getScreenSize( &screenWidth, &screenHeight );

  float fingerRadius = 30;

  AQInputAction *action = AQInput_findAction( aqstr( "rotate-left" ));
  if ( action->active ) {
    float radians = AQRenderer_camera()->radians;
    SLLeaper_applyDirection( leaper, radians );
  }

  action = AQInput_findAction( aqstr( "rotate-right" ));
  if ( action->active ) {
    float radians = AQRenderer_camera()->radians + M_PI;
    SLLeaper_applyDirection( leaper, radians );
  }

  action = AQInput_findAction( aqstr( "jump" ));
  if ( action->active ) {
    float radians = AQRenderer_camera()->radians - M_PI / 2;
    SLLeaper_applyDirection( leaper, radians );
  }

  action = AQInput_findAction( aqstr( "zoom" ));
  if ( action->active ) {
    SLCameraController_inputPress( cameraController );
  }

  AQArray *touches = AQInput_getTouches();
  AQTouch *touch = (AQTouch *) AQArray_atIndex( touches, 0 );
  if ( touch ) {
    aqvec2 centerDiff = (aqvec2) { touch->x - screenWidth / 2, touch->y - screenHeight / 2 };

    // printf( "touch: %s %f %f\n",
    //   touch->state == AQTouchBegan ?
    //     "began" :
    //     touch->state == AQTouchEnded ?
    //       "ended" :
    //       "moved",
    //   touch->wx,
    //   touch->wy );
    switch ( touch->state ) {
      case AQTouchBegan:
        // AQFlowLine_addPoint( flowLine, (aqvec2) { touch->wx, touch->wy });

        if ( leaper && touch->finger == 1 && aqvec2_mag( centerDiff ) > fingerRadius ) {
          aqvec2 dir = aqvec2_normalized( (aqvec2) { touch->x - screenWidth / 2, touch->y - screenHeight / 2 });
          AQDOUBLE radians =
            atan2( -dir.y, -dir.x ) + AQRenderer_camera()->radians;
          // printf( "%f %s\n", radians, aqvec2_cstr( dir ) );

          SLLeaper_applyDirection( leaper, radians );
        }
      case AQTouchMoved:
      case AQTouchStationary:
        if ( cameraController ) {
          if ( touch->finger == 3 || aqvec2_mag( centerDiff ) < fingerRadius ) {
            SLCameraController_inputPress( cameraController );
          }
        }

        if ( leaper && touch->finger == 1 && aqvec2_mag( centerDiff ) > fingerRadius ) {
          aqvec2 dir = aqvec2_normalized( (aqvec2) { touch->x - screenWidth / 2, touch->y - screenHeight / 2 });
          AQDOUBLE radians =
            atan2( -dir.y, -dir.x ) + AQRenderer_camera()->radians;
          // printf( "%f %s\n", radians, aqvec2_cstr( dir ) );

          SLLeaper_applyDirection( leaper, radians );
        }
        // AQFlowLine_addPoint( flowLine, (aqvec2) { touch->wx, touch->wy });
        break;
      case AQTouchEnded:
        // AQFlowLine_addPoint( flowLine, (aqvec2) { touch->wx, touch->wy });
        // AQFlowLine_createParticles( flowLine, world );
        // AQFlowLine_clearPoints( flowLine );
        // printf( "particles: %d %d\n",
        //   AQList_length( flowLine->particles ),
        //   AQList_length( world->particles ));
        break;
      default:
        break;
    }
  }
}

static float hertztime = 0;
static float fpstime = 0;
static int frames = 0;
static const unsigned int kMaxFrameTimes = 100;
static unsigned int frameTimes[ kMaxFrameTimes ];
static int frameTimeIndex = 0;
void stepWaterTest(float dt) {
    if ( paused ) { return; }

    AQReleasePool *pool = aqinit( aqalloc( &AQReleasePoolType ));
    hertztime += dt;

    int startTime = 0;
    int endTime = 0;

    if (hertztime > kFrameFraction) {
        if ( getTicks ) {
          startTime = getTicks();
        }
        frames++;

        if ( leaper && leaper->onvisit != visitedCallback ) {
          leaper->onvisit = visitedCallback;
          visitedCallback( leaper->visited );
        }
        if ( leaper && leaper->onresource != resourceCallback ) {
          leaper->onresource = resourceCallback;
          resourceCallback( leaper->totalResource );
        }

        AQLoop_step( kFrameFraction );

        if ( leaper && leaper->state == LostLeaperState && endCallback ) {
          endCallback();
        }

        while (hertztime > kFrameFraction) {
          hertztime -= kFrameFraction;
        }
        if ( getTicks ) {
          endTime = getTicks();
        }
    }

    fpstime += dt;
    if (fpstime > 1) {
        // printf("%d frames in %fs\n", frames, fpstime);
        fpstime = 0;
        frames = 0;
    }

    if ( getTicks && startTime != 0 ) {
      frameTimes[ frameTimeIndex++ ] = endTime - startTime;
      if ( frameTimeIndex >= kMaxFrameTimes ) {
        #if PPHYS_ALLOW_SLEEP
        printf( "awake %d ", world->awakeParticles );
        #endif
        printf(
          "min %d, max %d, avg %d, stddev %f\n",
          minTime( frameTimes, kMaxFrameTimes ),
          maxTime( frameTimes, kMaxFrameTimes ),
          avgTime( frameTimes, kMaxFrameTimes ),
          stddevTime( frameTimes, kMaxFrameTimes )
        );
        frameTimeIndex = 0;
      }
    }

    aqfree( pool );
}

void drawWaterTest() {
  AQReleasePool *pool = aqinit( aqalloc( &AQReleasePoolType ));

  //
  // Run renderer
  //

  AQRenderer_draw();

  //
  // Debug draw particles
  //

  AQShaders_useProgram( ColorShaderProgram );

  // struct gldata data;
  // data.index = 0;
  // AQList_iterate(
  //   world->particles,
  //   (AQList_iterator) set_particle_vertices,
  //   &data
  // );
  // 
  // AQShaders_draw(
  //   buffer,
  //   data.particles,
  //   sizeof(struct glparticle) * (data.index)
  // );

  aqfree( pool );
}

void pauseSpaceLeaper() {
  paused = 1;
}

void resumeSpaceLeaper() {
  paused = 0;
}

void setSpaceLeaperEndCallback( void (*callback)() ) {
  endCallback = callback;
}

void setSpaceLeaperVisitedCallback( void (*callback)( unsigned int ) ) {
  visitedCallback = callback;
}

void setSpaceLeaperResourceCallback( void (*callback)( unsigned int ) ) {
  resourceCallback = callback;
}
