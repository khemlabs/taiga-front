var utils = require('../utils');
var backlogHelper = require('../helpers').backlog;
var commonHelper = require('../helpers').common;

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

describe('backlog', function() {
    before(async function() {
        browser.get(browser.params.glob.host + 'project/project-3/backlog');
        await utils.common.waitLoader();

        utils.common.takeScreenshot('backlog', 'backlog');
    });

    describe('create US', function() {
        let createUSLightbox = null;

        before(async function() {
            backlogHelper.openNewUs();

            createUSLightbox = backlogHelper.getCreateEditUsLightbox();

            await createUSLightbox.waitOpen();
        });

        it('capture screen', function() {
            utils.common.takeScreenshot('backlog', 'create-us');
        });

        it('fill form', async function() {
            // subject
            createUSLightbox.subject().sendKeys('subject');

            // roles
            await createUSLightbox.setRole(1, 3);
            await createUSLightbox.setRole(3, 4);

            let totalPoints = await createUSLightbox.getRolePoints();

            expect(totalPoints).to.be.equal('3');

            // status
            createUSLightbox.status(2).click();

            // tags
            createUSLightbox.tags().sendKeys('aaa');
            browser.actions().sendKeys(protractor.Key.ENTER).perform();

            createUSLightbox.tags().sendKeys('bbb');
            browser.actions().sendKeys(protractor.Key.ENTER).perform();

            // description
            createUSLightbox.description().sendKeys('test test');

            //settings
            createUSLightbox.settings(0).click();

            await utils.common.waitTransitionTime(createUSLightbox.settings(0));
        });

        it('upload attachments', commonHelper.lightboxAttachment);

        it('screenshots', function() {
            utils.common.takeScreenshot('backlog', 'create-us-filled');
        });

        it('send form', async function() {
            let usCount = await backlogHelper.userStories().count();

            createUSLightbox.submit();

            await utils.lightbox.close(createUSLightbox.el);

            await browser.waitForAngular();

            let newUsCount = await backlogHelper.userStories().count();

            expect(newUsCount).to.be.equal(usCount + 1);
        });
    });

    describe('bulk create US', function() {
        let createUSLightbox = null;

        before(async function() {
            backlogHelper.openBulk();

            createUSLightbox = backlogHelper.getBulkCreateLightbox();

            await createUSLightbox.waitOpen();
        });

        it('fill form', function() {
            createUSLightbox.textarea().sendKeys('aaa');
            browser.actions().sendKeys(protractor.Key.ENTER).perform();

            createUSLightbox.textarea().sendKeys('bbb');
            browser.actions().sendKeys(protractor.Key.ENTER).perform();
        });

        it('send form', async function() {
            let usCount = await backlogHelper.userStories().count();

            createUSLightbox.submit();

            await createUSLightbox.waitClose();

            let newUsCount = await backlogHelper.userStories().count();

            expect(newUsCount).to.be.equal(usCount + 2);
        });
    });

    describe('edit US', function() {
        let editUSLightbox = null;

        before(async function() {
            backlogHelper.openUsBacklogEdit(0);

            editUSLightbox = backlogHelper.getCreateEditUsLightbox();

            await editUSLightbox.waitOpen();
        });

        it('fill form', async function() {
            // subject
            editUSLightbox.subject().sendKeys('subjectedit');

            // roles
            await editUSLightbox.setRole(0, 3);
            await editUSLightbox.setRole(1, 3);
            await editUSLightbox.setRole(2, 3);
            await editUSLightbox.setRole(3, 3);

            let totalPoints = await editUSLightbox.getRolePoints();

            expect(totalPoints).to.be.equal('4');

            // status
            editUSLightbox.status(3).click();

            // tags
            editUSLightbox.tags().sendKeys('www');
            browser.actions().sendKeys(protractor.Key.ENTER).perform();

            editUSLightbox.tags().sendKeys('xxx');
            browser.actions().sendKeys(protractor.Key.ENTER).perform();

            // description
            editUSLightbox.description().sendKeys('test test test test');

            //settings
            editUSLightbox.settings(1).click();
        });

        it('upload attachments', commonHelper.lightboxAttachment);

        it('send form', async function() {
            editUSLightbox.submit();

            await editUSLightbox.waitClose();
        });
    });

    it('edit status inline', async function() {
        await backlogHelper.setUsStatus(0, 1);

        // debounce
        await browser.sleep(2000);

        let statusText = await backlogHelper.setUsStatus(0, 2);

        expect(statusText).to.be.equal('In progress');
    });

    it('edit points inline', async function() {
        let usPointsOriginal = await backlogHelper.getUsPoints(0, 1, 1);

        await backlogHelper.setUsPoints(0, 1, 1);

        let usPointsNew = await backlogHelper.getUsPoints(0);

        expect(usPointsOriginal).not.to.be.equal(usPointsNew);
    });

    it('delete US', async function() {
        let usCount = await backlogHelper.userStories().count();

        backlogHelper.deleteUs(0);

        await utils.lightbox.confirm.ok();

        let newUsCount = await backlogHelper.userStories().count();

        expect(newUsCount).to.be.equal(usCount - 1);
    });

    it('drag backlog us', async function() {
        let dragableElements = backlogHelper.userStories();

        let dragElement = dragableElements.get(1);
        let dragElementHandler = dragElement.$('.icon-drag');
        let draggedElementRef = await backlogHelper.getUsRef(dragElement);

        await utils.common.drag(dragElementHandler, dragableElements.get(0));
        await browser.waitForAngular();

        let firstElementTextRef = await backlogHelper.getUsRef(dragableElements.get(0));

        expect(firstElementTextRef).to.be.equal(draggedElementRef);
    });

    utils.common.browserSkip(['firefox', 'internet explorer'], 'reorder multiple us', async function() {
        let dragableElements = backlogHelper.userStories();

        let count = await dragableElements.count();

        let draggedRefs = [];

        //element 1
        let dragElement = dragableElements.get(count - 1);
        dragElement.$('input[type="checkbox"]').click();
        let ref1 = await backlogHelper.getUsRef(dragElement);
        draggedRefs.push(await backlogHelper.getUsRef(dragElement));

        //element 2
        dragElement = dragableElements.get(count - 2);
        dragElement.$('input[type="checkbox"]').click();
        let ref2 = await backlogHelper.getUsRef(dragElement);
        draggedRefs.push(await backlogHelper.getUsRef(dragElement));

        await utils.common.drag(dragElement, dragableElements.get(0));
        await browser.sleep(200);

        let elementRef1 = await backlogHelper.getUsRef(dragableElements.get(0));
        let elementRef2 = await backlogHelper.getUsRef(dragableElements.get(1));

        expect(elementRef2).to.be.equal(draggedRefs[0]);
        expect(elementRef1).to.be.equal(draggedRefs[1]);
    });

    utils.common.browserSkip(['firefox', 'internet explorer'], 'drag multiple us to milestone', async function() {
        let sprint = backlogHelper.sprints().get(0);
        let initUssSprintCount = await backlogHelper.getSprintUsertories(sprint).count();

        let dragableElements = backlogHelper.userStories();

        let draggedRefs = [];

        // the us 1 and 2 are selected on the previous test

        let dragElement = dragableElements.get(0);
        let dragElementHandler = dragElement.$('.icon-drag');

        await utils.common.drag(dragElementHandler, sprint);
        await browser.waitForAngular();

        let ussSprintCount = await backlogHelper.getSprintUsertories(sprint).count();

        expect(ussSprintCount).to.be.equal(initUssSprintCount + 2);
    });

    it('drag us to milestone', async function() {
        let sprint = backlogHelper.sprints().get(0);

        let dragableElements = backlogHelper.userStories();
        let dragElement = dragableElements.get(0);
        let dragElementHandler = dragElement.$('.icon-drag');

        let draggedElementRef = await backlogHelper.getUsRef(dragElement);

        let initUssSprintCount = await backlogHelper.getSprintUsertories(sprint).count();

        await utils.common.drag(dragElementHandler, sprint);
        await browser.waitForAngular();

        let ussSprintCount = await backlogHelper.getSprintUsertories(sprint).count();

        expect(ussSprintCount).to.be.equal(initUssSprintCount + 1);
    });

    it('move to current sprint button', async function() {
        let dragableElements = backlogHelper.userStories();
        let count = await dragableElements.count();
        let dragElement = dragableElements.get(count - 1);

        dragElement.$('input[type="checkbox"]').click();

        let draggedRef = await backlogHelper.getUsRef(dragElement);

        $('#move-to-current-sprint').click();

        let sprint = backlogHelper.sprintsOpen().last();

        let sprintRefs = await backlogHelper.getSprintsRefs(sprint);

        expect(sprintRefs.indexOf(draggedRef)).to.be.not.equal(-1);
    });

    utils.common.browserSkip(['firefox', 'internet explorer'], 'reorder milestone us', async function() {
        let sprint = backlogHelper.sprints().get(0);
        let dragableElements = backlogHelper.getSprintUsertories(sprint);

        let dragElement = await dragableElements.get(3);
        let draggedElementRef = await backlogHelper.getUsRef(dragElement);

        await utils.common.drag(dragElement, dragableElements.get(0));
        await browser.waitForAngular();

        let firstElementRef = await backlogHelper.getUsRef(dragableElements.get(0));

        expect(firstElementRef).to.be.equal(firstElementRef);
    });

    utils.common.browserSkip(['firefox', 'internet explorer'], 'drag us from milestone to milestone', async function() {
        let sprint1 = backlogHelper.sprints().get(0);
        let sprint2 = backlogHelper.sprints().get(1);

        let initUssSprintCount = await backlogHelper.getSprintUsertories(sprint2).count();

        let dragElement = backlogHelper.getSprintUsertories(sprint1).get(0);

        await utils.common.drag(dragElement, sprint2);
        await browser.waitForAngular();

        let firstElement = backlogHelper.getSprintUsertories(sprint2).get(0);

        let ussSprintCount = await backlogHelper.getSprintUsertories(sprint2).count();

        expect(ussSprintCount).to.be.equal(initUssSprintCount + 1);
    });

    utils.common.browserSkip('internet explorer', 'select us with SHIFT', async function() {
        let dragableElements = backlogHelper.userStories();

        let firstInput = dragableElements.get(0).$('input[type="checkbox"]');
        let lastInput = dragableElements.get(3).$('input[type="checkbox"]');

        await browser.actions()
            .mouseMove(firstInput)
            .keyDown(protractor.Key.SHIFT)
            .click()
            .mouseMove(lastInput)
            .click()
            .keyUp(protractor.Key.SHIFT)
            .perform();

        let count = await backlogHelper.selectedUserStories().count();

        expect(count).to.be.equal(4);
    });

    it('role filters', async function() {
        await backlogHelper.fiterRole(1);

        utils.common.takeScreenshot('backlog', 'backlog-role-filters');

        let usPoints = await backlogHelper.getUsPoints(0);

        expect(usPoints).to.match(/[0-9?]+\s\/\s[0-9?]+/);
    });

    describe('milestones', function() {
        it('create', async function() {
            backlogHelper.openNewMilestone();

            let createMilestoneLightbox = backlogHelper.getCreateEditMilestone();

            await createMilestoneLightbox.waitOpen();

            utils.common.takeScreenshot('backlog', 'create-milestone');

            let sprintName = 'sprintName' + new Date().getTime();

            createMilestoneLightbox.name().sendKeys(sprintName);

            createMilestoneLightbox.submit();
            await browser.waitForAngular();

            // debounce
            await browser.sleep(2000);

            let sprintTitles = await backlogHelper.getSprintsTitles();

            expect(sprintTitles.indexOf(sprintName)).to.be.not.equal(-1);
        });

        it('edit', async function() {
            backlogHelper.openMilestoneEdit(0);

            let createMilestoneLightbox = backlogHelper.getCreateEditMilestone();

            await createMilestoneLightbox.waitOpen();

            await createMilestoneLightbox.name().clear();

            let sprintName = 'sprintName' + new Date().getTime();

            createMilestoneLightbox.name().sendKeys(sprintName);

            createMilestoneLightbox.submit();

            await createMilestoneLightbox.waitClose();

            let sprintTitles = await backlogHelper.getSprintsTitles();

            expect(sprintTitles.indexOf(sprintName)).to.be.not.equal(-1);
        });

        it('delete', async function() {
            backlogHelper.openMilestoneEdit(0);

            let createMilestoneLightbox = backlogHelper.getCreateEditMilestone();

            await createMilestoneLightbox.waitOpen();

            createMilestoneLightbox.delete();

            await utils.lightbox.confirm.ok();
            await browser.waitForAngular();

            let sprintName = createMilestoneLightbox.name().getAttribute('value');
            let sprintTitles = await backlogHelper.getSprintsTitles();

            expect(sprintTitles.indexOf(sprintName)).to.be.equal(-1);
        });
    });

    describe('tags', function() {
        it('show', function() {
            $('#show-tags').click();

            utils.common.takeScreenshot('backlog', 'backlog-tags');

            let tag = $$('.backlog-table .tag').get(0);

            expect(tag.isDisplayed()).to.be.eventually.true;
        });

        it('hide', function() {
            $('#show-tags').click();

            let tag = $$('.backlog-table .tag').get(0);

            expect(tag.isDisplayed()).to.be.eventually.false;
        });
    });

    describe('filters', function() {
        it('show filters', async function() {
            let transition = utils.common.transitionend('.menu-secondary.filters-bar', 'opacity');

            $('#show-filters-button').click();

            await transition();

            utils.common.takeScreenshot('backlog', 'backlog-filters');
        });

        it('filter by subject', async function() {
            let usCount = await backlogHelper.userStories().count();
            let filterQ = element(by.model('filtersQ'));

            let htmlChanges = await utils.common.outerHtmlChanges('.backlog-table-body');

            await filterQ.sendKeys('add');

            await htmlChanges();

            let newUsCount = await backlogHelper.userStories().count();

            expect(newUsCount).to.be.below(usCount);

            htmlChanges = await utils.common.outerHtmlChanges('.backlog-table-body');

            // clear status
            await filterQ.clear();

            await htmlChanges();
        });

        it('filter by ref', async function() {
            let userstories = backlogHelper.userStories();
            let filterQ = element(by.model('filtersQ'));
            let htmlChanges = await utils.common.outerHtmlChanges('.backlog-table-body');

            let ref = await backlogHelper.getTestingFilterRef();

            ref = ref.replace('#', '');

            await filterQ.sendKeys(ref);
            await htmlChanges();

            let newUsCount = await userstories.count();
            expect(newUsCount).to.be.equal(1);

            htmlChanges = await utils.common.outerHtmlChanges('.backlog-table-body');

            // clear status
            await filterQ.clear();

            await htmlChanges();
        });

        it('filter by status', async function() {
            let usCount = await backlogHelper.userStories().count();

            let htmlChanges = await utils.common.outerHtmlChanges('.backlog-table-body');

            $$('.filters-cats a').first().click();
            $$('.filter-list a').first().click();

            await htmlChanges();

            let newUsCount = await backlogHelper.userStories().count();

            expect(newUsCount).to.be.below(usCount);

            //remove status
            htmlChanges = await utils.common.outerHtmlChanges('.backlog-table-body');

            $$('.filters-applied a').first().click();

            await htmlChanges();

            newUsCount = await backlogHelper.userStories().count();

            expect(newUsCount).to.be.equal(usCount);

            backlogHelper.goBackFilters();
        });

        it('filter by tags', async function() {
            let usCount = await backlogHelper.userStories().count();
            let htmlChanges = await utils.common.outerHtmlChanges('.backlog-table-body');

            $$('.filters-cats a').get(1).click();
            await browser.waitForAngular();

            $$('.filter-list a').first().click();

            await htmlChanges();

            let newUsCount = await backlogHelper.userStories().count();

            expect(newUsCount).to.be.below(usCount);

            //remove tags
            htmlChanges = await utils.common.outerHtmlChanges('.backlog-table-body');

            $$('.filters-applied a').first().click();

            await htmlChanges();

            newUsCount = await backlogHelper.userStories().count();

            expect(newUsCount).to.be.equal(usCount);
        });

        it('trying drag with filters open', async function() {
            let dragableElements =  backlogHelper.userStories();
            let dragElement = dragableElements.get(5);

            await utils.common.drag(dragElement, dragableElements.get(0));

            let waitErrorOpen = await utils.notifications.error.open();

            expect(waitErrorOpen).to.be.true;

            await utils.notifications.error.close();
        });

        it('hide filters', async function() {
            let menu = $('.menu-secondary.filters-bar');
            let transition = utils.common.transitionend('.menu-secondary.filters-bar', 'width');

            $('#show-filters-button').click();

            await transition();

            let waitWidth = await menu.getCssValue('width');

            expect(waitWidth).to.be.equal('0px');
        });
    });

    describe('closed sprints', function() {
        async function createEmptyMilestone() {
            backlogHelper.openNewMilestone();

            let createMilestoneLightbox = backlogHelper.getCreateEditMilestone();

            await createMilestoneLightbox.waitOpen();

            createMilestoneLightbox.name().sendKeys('sprintName' + new Date().getTime());
            createMilestoneLightbox.submit();

            return createMilestoneLightbox.waitClose();
        }

        async function dragClosedUsToMilestone() {
            await backlogHelper.setUsStatus(2, 5);

            let dragElement =  backlogHelper.userStories().get(2);
            let dragElementHandler = dragElement.$('.icon-drag');

            let sprint = backlogHelper.sprints().last();
            await utils.common.drag(dragElementHandler, sprint);

            return browser.waitForAngular();
        }

        before(async function() {
            await createEmptyMilestone();
            await dragClosedUsToMilestone();
        });

        it('open closed sprints', async function() {
            backlogHelper.toggleClosedSprints();

            let closedSprints = await backlogHelper.closedSprints().count();

            expect(closedSprints).to.be.equal(1);
        });

        it('close closed sprints', async function() {
            backlogHelper.toggleClosedSprints();

            let closedSprints = await backlogHelper.closedSprints().count();

            expect(closedSprints).to.be.equal(0);
        });

        utils.common.browserSkip(['firefox', 'internet explorer'], 'open sprint by drag open US to closed sprint', async function() {
            backlogHelper.toggleClosedSprints();

            await backlogHelper.setUsStatus(1, 0);

            let dragElement =  backlogHelper.userStories().get(0);
            let dragElementHandler = dragElement.$('.icon-drag');

            let sprint = backlogHelper.sprints().last();
            await utils.common.drag(dragElementHandler, sprint);
            await browser.waitForAngular();

            let closedSprints = await backlogHelper.closedSprints().count();

            expect(closedSprints).to.be.equal(0);
        });
    });
});
