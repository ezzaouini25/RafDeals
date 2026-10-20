import { getActiveHeaderScripts } from '@/lib/header-scripts';

interface HeaderScriptsProps {
  placement: 'head_open' | 'head_close' | 'body_open' | 'body_close';
}

export default async function HeaderScripts({ placement }: HeaderScriptsProps) {
  const scripts = await getActiveHeaderScripts();
  const filteredScripts = scripts.filter(s => s.placement === placement);

  if (filteredScripts.length === 0) return null;

  return (
    <>
      {filteredScripts.map((script) => {
        // ✅ If raw_code exists, render it directly
        if (script.raw_code) {
          return (
            <div key={script.id} dangerouslySetInnerHTML={{ __html: script.raw_code }} />
          );
        }
        
        // ✅ If payload exists, render based on type
        if (script.payload) {
          try {
            const payload = typeof script.payload === 'string' 
              ? JSON.parse(script.payload) 
              : script.payload;
            
            // Handle different payload types
            if (payload.type === 'meta') {
              return (
                <meta 
                  key={script.id}
                  name={payload.name} 
                  content={payload.content} 
                />
              );
            }
            if (payload.type === 'script') {
              return (
                <script 
                  key={script.id}
                  src={payload.src}
                  async={payload.async}
                  defer={payload.defer}
                  dangerouslySetInnerHTML={{ __html: payload.innerHTML || '' }}
                />
              );
            }
            if (payload.type === 'link') {
              return (
                <link 
                  key={script.id}
                  rel={payload.rel}
                  href={payload.href}
                  crossOrigin={payload.crossOrigin}
                />
              );
            }
          } catch (error) {
            console.error('Error parsing payload:', error);
            return null;
          }
        }
        
        return null;
      })}
    </>
  );
}