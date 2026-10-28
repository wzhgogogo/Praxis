// Records actual Node test outcomes; never changes test execution or assertions.
export default async function* report(events) {
  for await (const event of events) {
    if (['test:enqueue','test:start','test:pass','test:fail','test:summary'].includes(event.type)) {
      yield JSON.stringify({event:event.type,data:event.data}, (key,value) => value instanceof Error ? {name:value.name,message:value.message,code:value.code} : value)+'\n';
    }
  }
}
