# UI-R01 / UI-R02 exact scoped regressions

Before-source contains the actual affected TopicGamesPanel and TopicCache plus newly added regression test/scheduler source. Four tests FAIL before the fix: public text persists after service read failure/expiry/disconnect, and private/public/chat/advice remain under wall rollback despite six elapsed seconds. after-source copies the corrected component and new shared monotonic clock; all four tests PASS. No whole-repository before-fix inventory is claimed. Independent round01 report was not edited; independent round02 is still required.
