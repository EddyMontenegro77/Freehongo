package ratelimit

import (
	"fmt"
	"math"
	"sync"
	"time"
)

type RateLimiterPolicy struct {
	MaxTokenCapacity    int
	TokensPerPeriod     float64
	ReplenishmentPeriod	time.Duration
}

func (p RateLimiterPolicy) RefillPerSecond() float64 {
	return p.TokensPerPeriod / p.ReplenishmentPeriod.Seconds()
}

type bucket struct {
	tokens		float64
	lastRefill	time.Time
}

type RateLimiter struct {
	policy		RateLimiterPolicy
	now     	func() time.Time
	mu			sync.Mutex
	lifecycleMu sync.Mutex
	buckets		map[string]*bucket
	stop    	chan struct{}
	closed		bool
	startOnce 	sync.Once
	stopOnce 	sync.Once
	wg 			sync.WaitGroup
}

func NewRateLimiter(policy RateLimiterPolicy) (*RateLimiter, error) {
	if policy.MaxTokenCapacity < 1 {
		return nil, fmt.Errorf("MaxTokenCapacity must be at least 1")
	}
	if policy.TokensPerPeriod <= 0 {
		return nil, fmt.Errorf("TokensPerPeriod must be positive")
	}
	if policy.ReplenishmentPeriod <= 0 {
		return nil, fmt.Errorf("ReplenishmentPeriod must be positive")
	}

    rl := &RateLimiter{
        policy:  policy,
		now:     time.Now,
        buckets: make(map[string]*bucket),
		stop:    make(chan struct{}),
    }
	return rl, nil
}

func (rl *RateLimiter) Start() {
	rl.lifecycleMu.Lock()
    defer rl.lifecycleMu.Unlock()

	if rl.closed {
        return
    }

    rl.startOnce.Do(func() {
        rl.wg.Go(rl.cleanupLoop)
    })
}

func (rl *RateLimiter) Close() {
	rl.lifecycleMu.Lock()
	rl.closed = true

    rl.stopOnce.Do(func() {
        close(rl.stop)
    })

	rl.lifecycleMu.Unlock()

    rl.wg.Wait()
}

func (rl *RateLimiter) idleTimeout() time.Duration {
	seconds := float64(rl.policy.MaxTokenCapacity) / rl.policy.RefillPerSecond()
	if seconds > float64(math.MaxInt64)/float64(time.Second) {
		return time.Duration(math.MaxInt64)
	}
	return time.Duration(seconds * float64(time.Second))
}

func (rl *RateLimiter) cleanupLoop() {
	interval := max(rl.idleTimeout(), time.Second)

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
			case <-ticker.C:
				rl.cleanup()
			case <-rl.stop:
				return
		}
	}
}

func (rl *RateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := rl.now()
	timeout := rl.idleTimeout()

	for key, b := range rl.buckets {
		if now.Sub(b.lastRefill) >= timeout {
			delete(rl.buckets, key)
		}
	}
}

func (rl *RateLimiter) ActiveBuckets() int {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	return len(rl.buckets)
}

func (limiter *RateLimiter) Allow(key string) (bool, time.Duration) {
	limiter.mu.Lock()
	defer limiter.mu.Unlock()

	now := limiter.now()
	userBucket, bucketExists := limiter.buckets[key]

	if !bucketExists {
		userBucket = &bucket{tokens: float64(limiter.policy.MaxTokenCapacity), lastRefill: now}
		limiter.buckets[key] = userBucket
	}

	refillRatePerSecond := limiter.policy.RefillPerSecond()
	elapsedSeconds := now.Sub(userBucket.lastRefill).Seconds()
	userBucket.tokens = math.Min(float64(limiter.policy.MaxTokenCapacity), userBucket.tokens + elapsedSeconds  * refillRatePerSecond)

	userBucket.lastRefill = now

	if userBucket.tokens >= 1 {
		userBucket.tokens--
		return true, 0
	}
	retryAfter := time.Duration((1 - userBucket.tokens) / refillRatePerSecond  * float64(time.Second))
	return false, retryAfter 
}

func RetryAfterSeconds(d time.Duration) int {
	return int(math.Ceil(d.Seconds()))
}