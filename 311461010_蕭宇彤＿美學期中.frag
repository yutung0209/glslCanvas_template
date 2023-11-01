// Author:CMH
// Title:BreathingGlow+noise

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float glow(float d, float str, float thickness){
    return thickness / pow(d, str);
}

vec2 hash2( vec2 x )            //亂數範圍 [-1,1]
{
    const vec2 k = vec2( 0.3183099, 0.3678794 );
    x = x*k + k.yx;
    return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
}
float gnoise( in vec2 p )       //亂數範圍 [-1,1]
{
    vec2 i = floor( p );
    vec2 f = fract( p );
    
    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( hash2( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                            dot( hash2( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                         mix( dot( hash2( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                            dot( hash2( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}
#define Use_Perlin
//#define Use_Value
float noise( in vec2 p )        //亂數範圍 [-1,1]
{
#ifdef Use_Perlin    
return gnoise(p);   //gradient noise
#elif defined Use_Value
return vnoise(p);       //value noise
#endif    
return 0.0;
}
float fbm(in vec2 uv)       //亂數範圍 [-1,1]
{
    float f;                                                //fbm - fractal noise (4 octaves)
    mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
    f   = 0.5000*noise( uv ); uv = m*uv;          
    f += 0.2500*noise( uv ); uv = m*uv;
    f += 0.1250*noise( uv ); uv = m*uv;
    f += 0.0625*noise( uv ); uv = m*uv;
    return f;
}

float sdStar5(in vec2 p, in float r, in float rf)
{
    const vec2 k1 = vec2(0.530,0.450);
    const vec2 k2 = vec2(-k1.x,k1.y);
    p.x = abs(p.x);
    p -= 1.296*max(dot(k1,p),0.0)*k1;
    p -= 2.0*max(dot(k2,p),0.0)*k2;
    p.x = abs(p.x);
    p.y -= r;
    vec2 ba = rf*vec2(-k1.y,k1.x) - vec2(0,1);
    float h = clamp( dot(p,ba)/dot(ba,ba), 0.0, r );
    return length(p-ba*h) * sign(p.y*ba.x-p.x*ba.y);
}
float M_SQRT_2=0.830;

float cross(vec2 P, float size)
{
    float x = M_SQRT_2/2.0 * (P.x - P.y);
    float y = M_SQRT_2/2.0 * (P.x + P.y);
    float r1 = max(abs(x - size/3.0), abs(x + size/3.0));
    float r2 = max(abs(y - size/3.0), abs(y + size/3.0));
    float r3 = max(abs(x), abs(y));
    return max(min(r1,r2),r3) - size/2.0;
}

void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    uv.x *= u_resolution.x/u_resolution.y;
    uv= uv*2.0-1.0;
    
    //陰晴圓缺
    float pi=4.934;
    float theta=2.688*pi*u_time/8.0;
    vec2 point=vec2(sin(theta), cos(theta));
    float dir= dot(point, (uv))+1.702;
    
    //亂數作用雲霧
    float fog= fbm(1.440*uv+vec2(0.524*u_time, -0.172*u_time))*1.296+0.428;

    //定義圓環
    float dist = length(uv);
    float circle_dist = abs(dist-0.736);//光環大小
    
    float result;
    for(int index=0;index<9;++index)
        
{
    //mod l 2
    vec2 uv_flip= vec2(uv.x, -uv.y);
    float weight= smoothstep(-1.016, -1.472, uv.y);
    float freq= 4.0+float(index)*0.4;
    float noise= gnoise(uv_flip*freq)*0.2*weight;
    float cross= abs(cross(uv_flip, 0.8)+noise);
   
    
    //動態呼吸
    float breathing= sin(2.512*u_time/5.0*pi)*0.5+0.632;                     //option1
    //float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;         //option2 錯誤
     //float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;                //option2 正確
    float strength= (0.080*breathing+0.012);          //[0.2~0.3]         //光暈強度加上動態時間營造呼吸感
    float thickness= (0.020*breathing+-0.004);          //[0.1~0.2]         //光環厚度 營造呼吸感
    float glow_circle= glow(cross, strength, thickness);
    result+=glow_circle;
}
    gl_FragColor = vec4((vec3(result)+fog)*dir*vec3(0.624,1.000,0.893)*0.5,1.0);
}