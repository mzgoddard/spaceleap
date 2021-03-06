#ifndef LIST_H_DXZWNGGA
#define LIST_H_DXZWNGGA

#include "./obj.h"

extern AQType AQListType;

typedef AQObj AQList;

typedef void (*AQList_iterator)( AQObj *, void * );
typedef int (*AQList_findIterator)( AQObj *, void * );

unsigned int AQList_length(AQList *);

AQList * AQList_push(AQList *, AQObj *);
AQObj * AQList_pop(AQList *);
AQList * AQList_unshift(AQList *, AQObj *);
AQList * AQList_insertAt(AQList *, AQObj *, int);

AQObj * AQList_at(AQList *, int);
AQObj * AQList_removeAt(AQList *, int);
int AQList_indexOf(AQList *, AQObj *);
AQObj * AQList_remove(AQList *, AQObj *);

AQList * AQList_iterate( AQList *, AQList_iterator, void * );
AQList * AQList_iterateN( AQList *, int, AQList_iterator, void * );
AQObj * AQList_find( AQList *, AQList_findIterator, void * );
int AQList_findIndex( AQList *, AQList_findIterator, void * );

void aqlist_init();

#endif /* end of include guard: LIST_H_DXZWNGGA */
